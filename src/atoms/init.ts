import { REPO_DIR } from "../lib/constants";
import { refreshFs } from "../lib/fs";
import { fetchCurrentUser } from "../lib/github";
import { initOnlineListener } from "../lib/online";
import { warmProcessor } from "../markdown";
import { getRepoWorker } from "../worker/client";
import { draftsAtom } from "./drafts";
import { send } from "./machine";
import { buildSearchIndex, initSearchSubscription } from "./search";
import type { AppMachine } from "./store";
import {
  cachedReposAtom,
  machineAtom,
  noteListAtom,
  selectedRepoAtom,
  store,
  userAtom,
} from "./store";
import { backgroundSync } from "./sync";

const unauthenticated: AppMachine = { phase: "unauthenticated", authError: null };

export function parseOAuthHash(): {
  username: string;
  token: string;
  installationId: string;
  email: string;
} | null {
  if (!window.location.hash) {
    return null;
  }

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
  if (!window.location.hash) {
    return null;
  }

  const params = new URLSearchParams(window.location.hash.substring(1));
  return params.get("auth_error");
}

export async function init() {
  initOnlineListener();
  initSearchSubscription();

  if (import.meta.env.DEV) {
    const localRepo = new URLSearchParams(window.location.search).get("localRepo");
    if (localRepo) {
      const { initFromLocalRepo } = await import("./init.local");
      await initFromLocalRepo(localRepo);
      return;
    }
  }

  const authError = parseAuthError();

  if (authError) {
    window.history.replaceState(null, "", window.location.pathname);
    store.set(machineAtom, { phase: "unauthenticated", authError });
    return;
  }

  const oauthParams = parseOAuthHash();

  if (oauthParams) {
    window.history.replaceState(null, "", window.location.pathname);
    await send({ type: "AUTHENTICATE", user: oauthParams });
    return;
  }

  const user = store.get(userAtom);
  const token = user?.token;

  if (!token) {
    store.set(machineAtom, unauthenticated);
    return;
  }

  const selectedRepo = store.get(selectedRepoAtom);
  const cachedRepos = store.get(cachedReposAtom);

  warmProcessor();

  const worker = getRepoWorker();

  if (selectedRepo && cachedRepos) {
    try {
      const repoState = await worker.getState();
      if (repoState.filenames.length > 0) {
        refreshFs();
        store.set(machineAtom, {
          phase: "ready",
          user,
          repos: cachedRepos,
          selectedRepo,
          filenames: repoState.filenames,
          hasRemote: true,
        });
        buildSearchIndex(store.get(noteListAtom));

        // Reconcile drafts from git state
        const existingFiles = new Set(repoState.filenames);
        const recoveredDrafts = repoState.drafts.map(({ timestamp, content }) => ({
          timestamp,
          content,
          isNew: !existingFiles.has(`${REPO_DIR}/${timestamp}.md`),
          minimized: true,
        }));

        store.set(draftsAtom, (prev) => {
          const existingTimestamps = new Set(prev.map((d) => d.timestamp));
          const newDrafts = recoveredDrafts.filter((d) => !existingTimestamps.has(d.timestamp));
          return [...prev, ...newDrafts];
        });

        backgroundSync(user);
        return;
      }
    } catch {
      // Fall through to re-auth
    }
  }

  try {
    const currentUser = await fetchCurrentUser(token);

    if (currentUser?.login) {
      await send({ type: "AUTHENTICATE", user });
    } else {
      store.set(userAtom, null);
      store.set(machineAtom, unauthenticated);
    }
  } catch {
    store.set(userAtom, null);
    store.set(machineAtom, unauthenticated);
  }
}
