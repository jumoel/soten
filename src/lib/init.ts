import { authErrorAtom, authenticate, authStateAtom, type User, userAtom } from "../state/auth";
import { cachedReposAtom, cloneStatusAtom, filenamesAtom, repoAtom } from "../state/repo";
import { store } from "../state/store";
import { getRepoWorker } from "../worker/client";
import { refreshFs } from "./fs";
import { fetchCurrentUser } from "./github";
import { initRouter } from "./router";

export function parseOAuthHash(): User | null {
  if (!window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.substring(1));
  const token = params.get("access_token");
  const username = params.get("username");
  const email = params.get("email");
  const installationId = params.get("app_install_id");
  if (token && username && installationId && email) {
    return { username, token, installationId, email };
  }
  return null;
}

export function parseAuthError(): string | null {
  if (!window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.substring(1));
  return params.get("auth_error");
}

let initPromise: Promise<void> | null = null;

export function init(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = doInit();
  return initPromise;
}

async function doInit(): Promise<void> {
  initRouter();
  const { initSyncListeners } = await import("../state/sync");
  initSyncListeners();

  if (import.meta.env.DEV) {
    const localRepo = new URLSearchParams(window.location.search).get("localRepo");
    if (localRepo) {
      const { initFromLocalRepo } = await import("./init-local");
      // Fire and forget: initFromLocalRepo sets auth atoms synchronously so the
      // app shell renders immediately. The clone runs in the background and
      // updates cloneStatusAtom to "ready" when done.
      void initFromLocalRepo(localRepo);
      return;
    }
  }

  const authError = parseAuthError();
  if (authError) {
    window.history.replaceState(null, "", window.location.pathname);
    store.set(authStateAtom, "error");
    store.set(authErrorAtom, authError);
    return;
  }

  const oauthParams = parseOAuthHash();
  if (oauthParams) {
    window.history.replaceState(null, "", window.location.pathname);
    await authenticate(oauthParams);
    return;
  }

  const user = store.get(userAtom);
  if (!user?.token) {
    store.set(authStateAtom, "unauthenticated");
    return;
  }

  const selectedRepo = store.get(repoAtom);
  const cachedRepos = store.get(cachedReposAtom);

  if (selectedRepo && cachedRepos) {
    try {
      const worker = getRepoWorker();
      const repoState = await worker.getState();
      if (repoState.filenames.length > 0) {
        refreshFs();
        store.set(filenamesAtom, repoState.filenames);
        store.set(cloneStatusAtom, "ready");
        store.set(authStateAtom, "authenticated");
        const { noteListAtom } = await import("../state/notes");
        const { buildSearchIndex } = await import("../state/search");
        await buildSearchIndex(store.get(noteListAtom));
        return;
      }
    } catch {
      // Fall through to re-auth
    }
  }

  try {
    const currentUser = await fetchCurrentUser(user.token);
    if (currentUser?.login) {
      await authenticate(user);
    } else {
      store.set(userAtom, null);
      store.set(authStateAtom, "unauthenticated");
    }
  } catch {
    store.set(userAtom, null);
    store.set(authStateAtom, "unauthenticated");
  }
}
