import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { refreshFs } from "../lib/fs";
import { getRepoWorker } from "../worker/client";
import type { RepoState } from "../worker/protocol";
import { authErrorAtom, authStateAtom, type User } from "./auth";
import { store } from "./store";

export type Repo = { owner: string; repo: string };
export type CloneStatus = "idle" | "fetching-repos" | "selecting" | "cloning" | "ready";

export const repoAtom = atomWithStorage<Repo | null>("selectedRepo", null, undefined, {
  getOnInit: true,
});
export const cachedReposAtom = atomWithStorage<string[] | null>("cachedRepos", null, undefined, {
  getOnInit: true,
});
export const cloneStatusAtom = atom<CloneStatus>("idle");
export const filenamesAtom = atom<string[]>([]);
export const hasRemoteAtom = atom(true);

export async function beginRepoFlow(user: User, repos: string[]): Promise<void> {
  store.set(cachedReposAtom, repos);

  const cached = store.get(repoAtom);
  if (cached && repos.includes(`${cached.owner}/${cached.repo}`)) {
    await cloneAndLoad(user, cached);
    return;
  }

  if (repos.length === 1) {
    const [owner, repo] = repos[0].split("/");
    const selected = { owner, repo };
    store.set(repoAtom, selected);
    await cloneAndLoad(user, selected);
    return;
  }

  store.set(repoAtom, null);
  store.set(cloneStatusAtom, "selecting");
  store.set(authStateAtom, "authenticated");
}

export async function selectRepo(owner: string, repo: string, user: User): Promise<void> {
  const selected = { owner, repo };
  store.set(repoAtom, selected);
  await cloneAndLoad(user, selected);
}

async function cloneAndLoad(user: User, repo: Repo): Promise<void> {
  store.set(cloneStatusAtom, "cloning");

  const url = `https://github.com/${repo.owner}/${repo.repo}.git`;
  const worker = getRepoWorker();

  try {
    const result = await worker.domainClone(url, user);
    await applyRepoState(result.state);
    store.set(repoAtom, repo);
    store.set(cloneStatusAtom, "ready");
    store.set(hasRemoteAtom, true);
    store.set(authStateAtom, "authenticated");
  } catch (e) {
    store.set(authStateAtom, "error");
    store.set(authErrorAtom, e instanceof Error ? e.message : String(e));
  }
}

export async function applyRepoState(state: RepoState): Promise<void> {
  if (state.filenames.length > 0) {
    store.set(filenamesAtom, state.filenames);
  }
  refreshFs();
  const { noteListAtom } = await import("./notes");
  const { buildSearchIndex } = await import("./search");
  await buildSearchIndex(store.get(noteListAtom));

  // Update draft timestamps for sync
  const { draftTimestampsAtom } = await import("./sync");
  store.set(
    draftTimestampsAtom,
    state.drafts.map((d) => d.timestamp),
  );
}

export function resetRepo(): void {
  store.set(repoAtom, null);
  store.set(cachedReposAtom, null);
  store.set(cloneStatusAtom, "idle");
  store.set(filenamesAtom, []);
}
