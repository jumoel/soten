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
export type View = { name: "front" } | { name: "note"; path: string };

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
      view: View;
    }
  | { name: "error"; user: User; message: string };

export type AppEvent =
  | { type: "AUTHENTICATED"; user: User }
  | { type: "AUTH_ERROR"; message: string }
  | { type: "NO_AUTH" }
  | { type: "REPOS_LOADED"; repos: string[]; cachedRepo: Repo | null }
  | { type: "FETCH_ERROR"; message: string }
  | { type: "SELECT_REPO"; repo: Repo }
  | { type: "REPO_READY"; filenames: string[]; files: Files }
  | { type: "LOAD_ERROR"; message: string }
  | { type: "SHOW_NOTE"; path: string }
  | { type: "SHOW_FRONT" }
  | { type: "SWITCH_REPO" }
  | { type: "LOGOUT" };

export function transition(state: AppMachineState, event: AppEvent): AppMachineState {
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
          const { repos, cachedRepo } = event;
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
            view: { name: "front" },
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
        case "SHOW_NOTE":
          return { ...state, view: { name: "note", path: event.path } };
        case "SHOW_FRONT":
          return { ...state, view: { name: "front" } };
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
  return "user" in state ? state.user : null;
}

function repoFromState(state: AppMachineState): Repo | null {
  return "repo" in state ? state.repo : null;
}

function syncCache(prev: AppMachineState, next: AppMachineState) {
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

export async function send(event: AppEvent) {
  const current = store.get(machineStateAtom);
  const next = transition(current, event);

  console.log("send", event.type, { from: current.name, to: next.name, event });

  if (next === current) return;

  store.set(machineStateAtom, next);
  syncCache(current, next);
  await runEffect(next, event, send);
}
