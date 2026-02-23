import { fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readFile, readRepoFiles, wipeFs } from "../lib/fs";
import type { AppMachineState, AppEvent, Files, Repo } from "./machine";
import { store, cachedRepoAtom, type User } from "./store";

type Send = (event: AppEvent) => Promise<void>;

export async function runEffect(state: AppMachineState, event: AppEvent, send: Send) {
  switch (state.name) {
    case "fetchingRepos":
      await effectFetchRepos(state.user, send);
      break;
    case "loadingRepo":
      if (event.type === "SELECT_REPO") {
        wipeFs();
      }
      await effectLoadRepo(state.user, state.repo, send);
      break;
    case "unauthenticated":
      if (event.type === "LOGOUT") {
        wipeFs();
      }
      break;
  }
}

async function effectFetchRepos(user: User, send: Send) {
  const repos = await fetchUserRepos(user.installationId, user.token);

  if (!repos) {
    await send({ type: "FETCH_ERROR", message: "Failed to fetch repos" });
    return;
  }

  if (repos.length === 0) {
    await send({ type: "FETCH_ERROR", message: "No repos found" });
    return;
  }

  const cachedRepo: Repo | null = store.get(cachedRepoAtom);

  await send({ type: "REPOS_LOADED", repos, cachedRepo });
}

async function effectLoadRepo(user: User, repo: Repo, send: Send) {
  try {
    if (await git.isInitialized()) {
      await git.pull(user);
    } else {
      await git.clone(`https://github.com/${repo.owner}/${repo.repo}.git`, user);
    }

    const filenames = await readRepoFiles();
    const files = await readAllFiles(filenames);

    await send({ type: "REPO_READY", filenames, files });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load repository";
    await send({ type: "LOAD_ERROR", message });
  }
}

async function readAllFiles(filenames: string[]): Promise<Files> {
  const entries = await Promise.all(
    filenames.map(async (filename) => {
      const content = await readFile(filename);
      if (content === null) return null;
      return [filename, content] as const;
    }),
  );

  return Object.fromEntries(entries.filter(Boolean));
}
