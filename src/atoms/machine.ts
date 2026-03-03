import {
  store,
  cachedUserAtom,
  cachedRepoAtom,
  type User,
  type TextFile,
  type ImageFile,
} from "./store";
import { atom } from "jotai";
import { runEffect } from "./effects";

export type Repo = { owner: string; repo: string };
export type Files = Record<string, TextFile | ImageFile>;

export type AppMachineState =
  | { name: "initializing" }
  | { name: "unauthenticated"; authError: string | null }
  | { name: "fetchingRepos"; user: User }
  | { name: "selectingRepo"; user: User; repos: string[] }
  | { name: "loadingRepo"; user: User; repo: Repo; repos: string[] }
  | {
      name: "ready";
      user: User;
      repo: Repo;
      repos: string[];
      filenames: string[];
      files: Files;
    }
  | { name: "error"; user: User; message: string };

export type AppEvent =
  | { type: "AUTHENTICATED"; user: User }
  | { type: "AUTH_ERROR"; message: string }
  | { type: "NO_AUTH" }
  | { type: "REPOS_LOADED"; repos: string[] }
  | { type: "FETCH_ERROR"; message: string }
  | { type: "SELECT_REPO"; repo: Repo }
  | { type: "REPO_READY"; filenames: string[]; files: Files }
  | { type: "LOAD_ERROR"; message: string }
  | { type: "SWITCH_REPO" }
  | { type: "RETRY" }
  | { type: "LOGOUT" };

export type TransitionContext = { cachedRepo: Repo | null };

export function transition(
  state: AppMachineState,
  event: AppEvent,
  ctx: TransitionContext,
): AppMachineState {
  switch (state.name) {
    case "initializing":
      switch (event.type) {
        case "AUTHENTICATED":
          return { name: "fetchingRepos", user: event.user };
        case "AUTH_ERROR":
          return { name: "unauthenticated", authError: event.message };
        case "NO_AUTH":
          return { name: "unauthenticated", authError: null };
        default:
          console.warn(`Invalid event ${event.type} in state ${state.name}`);
          return state;
      }

    case "unauthenticated":
      switch (event.type) {
        case "AUTHENTICATED":
          return { name: "fetchingRepos", user: event.user };
        default:
          console.warn(`Invalid event ${event.type} in state ${state.name}`);
          return state;
      }

    case "fetchingRepos":
      switch (event.type) {
        case "REPOS_LOADED": {
          const { repos } = event;
          const { cachedRepo } = ctx;
          if (cachedRepo && repos.includes(`${cachedRepo.owner}/${cachedRepo.repo}`)) {
            return { name: "loadingRepo", user: state.user, repo: cachedRepo, repos };
          }
          if (repos.length === 1) {
            const [owner, repo] = repos[0].split("/");
            return { name: "loadingRepo", user: state.user, repo: { owner, repo }, repos };
          }
          return { name: "selectingRepo", user: state.user, repos };
        }
        case "FETCH_ERROR":
          return { name: "error", user: state.user, message: event.message };
        case "LOGOUT":
          return { name: "unauthenticated", authError: null };
        default:
          console.warn(`Invalid event ${event.type} in state ${state.name}`);
          return state;
      }

    case "selectingRepo":
      switch (event.type) {
        case "SELECT_REPO":
          return { name: "loadingRepo", user: state.user, repo: event.repo, repos: state.repos };
        case "LOGOUT":
          return { name: "unauthenticated", authError: null };
        default:
          console.warn(`Invalid event ${event.type} in state ${state.name}`);
          return state;
      }

    case "loadingRepo":
      switch (event.type) {
        case "REPO_READY":
          return {
            name: "ready",
            user: state.user,
            repo: state.repo,
            repos: state.repos,
            filenames: event.filenames,
            files: event.files,
          };
        case "LOAD_ERROR":
          return { name: "error", user: state.user, message: event.message };
        case "LOGOUT":
          return { name: "unauthenticated", authError: null };
        default:
          console.warn(`Invalid event ${event.type} in state ${state.name}`);
          return state;
      }

    case "ready":
      switch (event.type) {
        case "SELECT_REPO":
          return { name: "loadingRepo", user: state.user, repo: event.repo, repos: state.repos };
        case "SWITCH_REPO":
          return { name: "selectingRepo", user: state.user, repos: state.repos };
        case "LOGOUT":
          return { name: "unauthenticated", authError: null };
        default:
          console.warn(`Invalid event ${event.type} in state ${state.name}`);
          return state;
      }

    case "error":
      switch (event.type) {
        case "RETRY":
          return { name: "fetchingRepos", user: state.user };
        case "LOGOUT":
          return { name: "unauthenticated", authError: null };
        default:
          console.warn(`Invalid event ${event.type} in state ${state.name}`);
          return state;
      }
  }
}

export const machineStateAtom = atom<AppMachineState>({ name: "initializing" });

function userFromState(state: AppMachineState): User | null {
  switch (state.name) {
    case "initializing":
    case "unauthenticated":
      return null;
    default:
      return state.user;
  }
}

function repoFromState(state: AppMachineState): Repo | null {
  switch (state.name) {
    case "loadingRepo":
    case "ready":
      return state.repo;
    default:
      return null;
  }
}

function syncCache(prev: AppMachineState, next: AppMachineState) {
  if (next.name === "unauthenticated" || next.name === "initializing") {
    store.set(cachedUserAtom, null);
    store.set(cachedRepoAtom, null);
    return;
  }

  const prevUser = userFromState(prev);
  const nextUser = userFromState(next);
  if (prevUser !== nextUser) {
    store.set(cachedUserAtom, nextUser);
  }

  const prevRepo = repoFromState(prev);
  const nextRepo = repoFromState(next);
  if (prevRepo !== nextRepo) {
    store.set(cachedRepoAtom, nextRepo);
  }
}

const queue: AppEvent[] = [];
let draining = false;

// Pipeline: for each queued event:
//   1. Build context (read cached repo from storage atoms)
//   2. Compute next state via transition() — pure, no side effects
//   3. Write next state to machineStateAtom
//   4. Sync localStorage cache (cachedUserAtom, cachedRepoAtom)
//   5. Run async effects (API calls, git ops) which may send() new events
export async function send(event: AppEvent) {
  queue.push(event);
  if (draining) return;
  draining = true;

  try {
    while (queue.length > 0) {
      const e = queue.shift()!;
      const ctx: TransitionContext = { cachedRepo: store.get(cachedRepoAtom) };
      const current = store.get(machineStateAtom);
      const next = transition(current, e, ctx);

      if (next !== current) {
        store.set(machineStateAtom, next);
        syncCache(current, next);
        await runEffect(next, e, ctx, send);
      }
    }
  } finally {
    draining = false;
  }
}
