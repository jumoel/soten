import { fetchUserRepos } from "../lib/github";
import { refreshFs } from "../lib/fs";
import { getRepoWorker } from "../worker/client";
import { t } from "../i18n";
import type { User, Repo } from "./store";
import {
  store,
  machineAtom,
  noteListAtom,
  userAtom,
  selectedRepoAtom,
  cachedReposAtom,
  clearCardCache,
} from "./store";
import { buildSearchIndex, clearSearchIndex } from "./search";
import { recoverDrafts } from "./draft-recovery";

function resetLocalState(): void {
  clearSearchIndex();
  clearCardCache();
  refreshFs();
}

export type Transition =
  | { type: "AUTHENTICATE"; user: User }
  | { type: "LOGOUT" }
  | { type: "SELECT_REPO"; owner: string; repo: string }
  | { type: "RETRY" };

class AbortError extends Error {}

let activeController: AbortController | null = null;

export async function send(transition: Transition): Promise<void> {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  function checkAborted() {
    if (controller.signal.aborted) throw new AbortError();
  }

  try {
    switch (transition.type) {
      case "AUTHENTICATE":
        await authenticate(transition.user, checkAborted);
        break;
      case "LOGOUT":
        logout();
        break;
      case "SELECT_REPO":
        await selectRepo(transition.owner, transition.repo, checkAborted);
        break;
      case "RETRY":
        await retry(checkAborted);
        break;
    }
  } catch (e) {
    if (e instanceof AbortError) return;
    throw e;
  } finally {
    if (activeController === controller) activeController = null;
  }
}

async function authenticate(user: User, checkAborted: () => void): Promise<void> {
  store.set(userAtom, user);
  store.set(machineAtom, { phase: "fetchingRepos", user });

  checkAborted();
  const repos = await fetchUserRepos(user.installationId, user.token);
  checkAborted();

  if (!repos) {
    store.set(machineAtom, { phase: "error", message: t("error.fetchReposFailed"), user });
    return;
  }

  store.set(cachedReposAtom, repos);

  if (repos.length === 0) {
    store.set(machineAtom, { phase: "error", message: t("error.noRepos"), user });
    return;
  }

  const cachedRepo = store.get(selectedRepoAtom);
  if (cachedRepo && repos.includes(`${cachedRepo.owner}/${cachedRepo.repo}`)) {
    await cloneAndLoad(user, repos, cachedRepo, checkAborted);
    return;
  }

  if (repos.length === 1) {
    const [owner, repo] = repos[0].split("/");
    const selectedRepo = { owner, repo };
    store.set(selectedRepoAtom, selectedRepo);
    await cloneAndLoad(user, repos, selectedRepo, checkAborted);
    return;
  }

  store.set(selectedRepoAtom, null);
  store.set(machineAtom, { phase: "selectingRepo", user, repos });
}

function logout(): void {
  store.set(userAtom, null);
  store.set(selectedRepoAtom, null);
  store.set(cachedReposAtom, null);
  resetLocalState();
  store.set(machineAtom, { phase: "unauthenticated", authError: null });
}

async function selectRepo(owner: string, repo: string, checkAborted: () => void): Promise<void> {
  const machine = store.get(machineAtom);
  if (machine.phase !== "selectingRepo" && machine.phase !== "ready") return;

  const selectedRepo = { owner, repo };
  store.set(selectedRepoAtom, selectedRepo);
  resetLocalState();
  await cloneAndLoad(machine.user, machine.repos, selectedRepo, checkAborted);
}

async function retry(checkAborted: () => void): Promise<void> {
  const machine = store.get(machineAtom);
  if (machine.phase !== "error") return;

  resetLocalState();
  await authenticate(machine.user, checkAborted);
}

async function cloneAndLoad(
  user: User,
  repos: string[],
  selectedRepo: Repo,
  checkAborted: () => void,
): Promise<void> {
  store.set(machineAtom, { phase: "cloningRepo", user, repos, selectedRepo });

  const url = `https://github.com/${selectedRepo.owner}/${selectedRepo.repo}.git`;
  const worker = getRepoWorker();

  try {
    if (await worker.isInitialized()) {
      try {
        await worker.pull(user);
      } catch {
        resetLocalState();
        await worker.clone(url, user);
      }
    } else {
      await worker.clone(url, user);
    }
  } catch (e) {
    store.set(machineAtom, {
      phase: "error",
      message: e instanceof Error ? e.message : String(e),
      user,
    });
    return;
  }

  checkAborted();

  const filenames = await worker.readRepoFiles();
  checkAborted();

  const hasRemote = await worker.hasRemote();
  checkAborted();

  refreshFs();
  store.set(machineAtom, { phase: "ready", user, repos, selectedRepo, filenames, hasRemote });
  buildSearchIndex(store.get(noteListAtom));
  await recoverDrafts(filenames);
}
