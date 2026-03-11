import { t } from "../i18n";
import { applyRepoState } from "../lib/apply-repo-state";
import { refreshFs } from "../lib/fs";
import { fetchUserRepos } from "../lib/github";
import { getRepoWorker } from "../worker/client";
import { buildSearchIndex, clearSearchIndex } from "./search";
import type { Repo, User } from "./store";
import {
  cachedReposAtom,
  clearCardCache,
  machineAtom,
  noteListAtom,
  selectedRepoAtom,
  store,
  userAtom,
} from "./store";

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

  let result: Awaited<ReturnType<typeof worker.domainClone>>;
  try {
    result = await worker.domainClone(url, user);
  } catch (e) {
    store.set(machineAtom, {
      phase: "error",
      message: e instanceof Error ? e.message : String(e),
      user,
    });
    return;
  }

  checkAborted();

  const hasRemote = true; // domainClone always clones from a remote
  refreshFs();
  store.set(machineAtom, {
    phase: "ready",
    user,
    repos,
    selectedRepo,
    filenames: result.state.filenames,
    hasRemote,
  });
  buildSearchIndex(store.get(noteListAtom));
  applyRepoState(result.state);
}
