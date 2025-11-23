import { createStore, atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchCurrentUser, fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { fs, readFile, readRepoDir, readRepoFiles, rmRepoDir, wipeFs } from "../lib/fs";

export const store = createStore();

export enum AppState {
  Initializing = "Initializing",
  Initialized = "Initialized",
}
export const appStateAtom = atom(AppState.Initializing);

export enum AuthState {
  Unauthenticated = "Unauthenticated",
  Authenticated = "Authenticated",
}
export const authStateAtom = atom(AuthState.Unauthenticated);

const errorAtom = atom<string | null>(null);

type TextFile = { type: "text"; content: string };
type ImageFile = { type: "image"; content: Blob };
export const filesAtom = atom<Record<string, TextFile | ImageFile>>({});

export enum AppView {
  Front = "Front",
  Note = "Note",
}
export const appViewAtom = atom<AppView>(AppView.Front);

async function init() {
  const user = store.get(userAtom);
  console.log("init", user);
  const token = user?.token;

  if (token) {
    const user = await fetchCurrentUser(token);

    if (user?.login) {
      dispatch(Event.AlreadyAuthenticated);
    } else {
      dispatch(Event.Logout);
    }
  } else {
    dispatch(Event.Logout);
  }

  store.set(appStateAtom, AppState.Initialized);
}

export enum Event {
  AlreadyAuthenticated = "AlreadyAuthenticated",
  Authenticated = "Authenticated",
  Logout = "Logout",
  FetchAndSelectRepos = "FetchAndSelectRepos",
  Error = "Error",
  SelectRepo = "SelectRepo",
  FetchRepoFiles = "FetchRepoFiles",
  RepoReady = "RepoReady",
  ReadRepoFilesContent = "ReadRepoFilesContent",
  ShowNote = "ShowNote",
  ShowFront = "ShowFront",
}

type DEvent<T, P> = { event: T; payload: P };
type DispatchEvents =
  | DEvent<Event.AlreadyAuthenticated, never>
  | DEvent<
      Event.Authenticated,
      { username: string; token: string; installationId: string; email: string }
    >
  | DEvent<Event.Logout, never>
  | DEvent<Event.FetchAndSelectRepos, never>
  | DEvent<Event.Error, { event?: Event; message: string }>
  | DEvent<Event.SelectRepo, { owner: string; repo: string }>
  | DEvent<Event.FetchRepoFiles, never>
  | DEvent<Event.RepoReady, never>
  | DEvent<Event.ReadRepoFilesContent, never>
  | DEvent<Event.ShowNote, { path: string }>
  | DEvent<Event.ShowFront, never>;

export function dispatch<E extends DispatchEvents["event"]>(
  event: E,
  payload?: Extract<DispatchEvents, { event: E }>["payload"],
) {
  const args = { event, payload } as DispatchEvents;

  return dispatchInternal(args);
}

export function dispatchInternal({ event, payload }: DispatchEvents) {
  console.log("Received Event", event, "with payload", payload);

  switch (event) {
    case Event.Error:
      store.set(errorAtom, payload.message);
      break;

    case Event.AlreadyAuthenticated:
      store.set(authStateAtom, AuthState.Authenticated);
      console.log(store.get(userAtom));

      dispatch(Event.FetchAndSelectRepos);

      break;

    case Event.Authenticated:
      store.set(userAtom, payload);
      store.set(authStateAtom, AuthState.Authenticated);

      dispatch(Event.FetchAndSelectRepos);

      break;

    case Event.Logout:
      (async () => {
        store.set(userAtom, null);
        store.set(authStateAtom, AuthState.Unauthenticated);
        store.set(repoFilenamesAtom, []);
        store.set(repoReadyAtom, false);
        store.set(appViewAtom, AppView.Front);
        await wipeFs();
      })();

      break;

    case Event.FetchAndSelectRepos:
      (async () => {
        const user = store.get(userAtom);

        if (!user) {
          dispatch(Event.Error, { event, message: "Invalid installationId or token" });
          return;
        }

        const repos = await fetchUserRepos(user.installationId, user.token);

        if (!repos) {
          dispatch(Event.Error, { message: "Failed to fetch repos" });
          return;
        }

        if (repos.length > 0) {
          const [owner, repo] = repos[0].split("/");

          dispatch(Event.SelectRepo, { owner, repo });
        } else {
          dispatch(Event.Error, { message: "No repos found" });
        }
      })();
      break;

    case Event.SelectRepo:
      store.set(selectedRepoAtom, payload);

      dispatch(Event.FetchRepoFiles);

      break;

    case Event.FetchRepoFiles:
      const selectedRepo = store.get(selectedRepoAtom);
      const user = store.get(userAtom);

      if (!selectedRepo || !user) {
        dispatch(Event.Error, { message: "Invalid state when fetching files" });
        return;
      }

      (async () => {
        if (await git.isInitialized()) {
          await git.pull(user);
        } else {
          await git.clone(
            `https://github.com/${selectedRepo.owner}/${selectedRepo.repo}.git`,
            user,
          );
        }

        const repoFiles = await readRepoFiles();
        store.set(repoFilenamesAtom, repoFiles);

        dispatch(Event.ReadRepoFilesContent);
      })();

      break;

    case Event.ReadRepoFilesContent:
      (async () => {
        const filenames = store.get(repoFilenamesAtom);

        const files = (
          await Promise.all(
            filenames.map(async (filename) => {
              const content = await readFile(filename);

              if (content === null) {
                return null;
              }

              return { [filename]: content };
            }),
          )
        )
          .filter(Boolean)
          .reduce((acc, obj) => Object.assign(acc, obj), {});

        store.set(filesAtom, files);

        dispatch(Event.RepoReady);
      })();

      break;

    case Event.RepoReady:
      store.set(repoReadyAtom, true);
      break;

    case Event.ShowNote:
      store.set(appViewAtom, AppView.Note);
      break;

    case Event.ShowFront:
      store.set(appViewAtom, AppView.Front);
      break;

    default:
      console.warn("Unimplemented event received:", event, "with payload", payload);
      return;
  }
}

export const selectedRepoAtom = atom<{ owner: string; repo: string } | null>(null);

export const repoReadyAtom = atom<boolean>(false);

export const userAtom = atomWithStorage<{
  username: string;
  token: string;
  installationId: string;
  email: string;
} | null>("user", null, undefined, { getOnInit: true });

// This is triggered for redirects after logins
window.addEventListener("load", () => {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    const username = params.get("username");
    const email = params.get("email");
    const installationId = params.get("app_install_id");

    // Ensure that the URL is actually a login redirect URL
    if (token && username && installationId && email) {
      dispatch(Event.Authenticated, { username, token, installationId, email });

      // Clear the URL hash after extracting the data
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      router();
    }
  }
});

function router() {
  const path = window.location.hash.substring(1);

  if (path === "/") {
    dispatch(Event.ShowFront);
  } else {
    dispatch(Event.ShowNote, { path });
  }
}

window.addEventListener("hashchange", router);

export const repoFilenamesAtom = atom<string[]>([]);

await init();
