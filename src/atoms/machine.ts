import { fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readFile, readRepoFiles, wipeFs } from "../lib/fs";
import { t } from "../i18n";
import type { User, TextFile, ImageFile, Repo } from "./store";
import { store, machineAtom, userAtom, selectedRepoAtom } from "./store";

export type Transition =
  | { type: "AUTHENTICATE"; user: User }
  | { type: "LOGOUT" }
  | { type: "SELECT_REPO"; owner: string; repo: string }
  | { type: "SWITCH_REPO" }
  | { type: "RETRY" };

class AbortError extends Error {}

let activeController: AbortController | null = null;

const BATCH_SIZE = 20;

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
      case "SWITCH_REPO":
        switchRepo();
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
  wipeFs();
  store.set(machineAtom, { phase: "unauthenticated", authError: null });
}

async function selectRepo(owner: string, repo: string, checkAborted: () => void): Promise<void> {
  const machine = store.get(machineAtom);
  if (machine.phase !== "selectingRepo" && machine.phase !== "ready") return;

  const selectedRepo = { owner, repo };
  store.set(selectedRepoAtom, selectedRepo);
  wipeFs();
  await cloneAndLoad(machine.user, machine.repos, selectedRepo, checkAborted);
}

function switchRepo(): void {
  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;

  store.set(machineAtom, { phase: "selectingRepo", user: machine.user, repos: machine.repos });
}

async function retry(checkAborted: () => void): Promise<void> {
  const machine = store.get(machineAtom);
  if (machine.phase !== "error") return;

  wipeFs();
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

  try {
    if (await git.isInitialized()) {
      try {
        await git.pull(user);
      } catch {
        wipeFs();
        await git.clone(url, user);
      }
    } else {
      await git.clone(url, user);
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

  const filenames = await readRepoFiles();
  checkAborted();

  store.set(machineAtom, {
    phase: "loadingFiles",
    user,
    repos,
    selectedRepo,
    filenames,
    loaded: 0,
  });

  const files: Record<string, TextFile | ImageFile> = {};

  for (let i = 0; i < filenames.length; i += BATCH_SIZE) {
    checkAborted();
    const batch = filenames.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (filename) => {
        const content = await readFile(filename);
        return content ? ({ filename, content } as const) : null;
      }),
    );

    for (const result of results) {
      if (result) files[result.filename] = result.content;
    }
  }

  checkAborted();

  store.set(machineAtom, { phase: "ready", user, repos, selectedRepo, filenames, files });
}
