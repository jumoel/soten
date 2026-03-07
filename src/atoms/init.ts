import { fetchCurrentUser } from "../lib/github";
import * as git from "../lib/git";
import { readRepoFiles } from "../lib/fs";
import { initOnlineListener } from "../lib/online";
import type { AppMachine } from "./store";
import {
  store,
  machineAtom,
  noteListAtom,
  userAtom,
  selectedRepoAtom,
  cachedReposAtom,
} from "./store";
import { send } from "./machine";
import { backgroundSync } from "./sync";
import { buildSearchIndex } from "./search";
import { warmProcessor } from "../markdown";

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

  if (selectedRepo && cachedRepos && (await git.isInitialized())) {
    const filenames = await readRepoFiles();
    store.set(machineAtom, {
      phase: "ready",
      user,
      repos: cachedRepos,
      selectedRepo,
      filenames,
    });
    buildSearchIndex(store.get(noteListAtom));
    backgroundSync(user);
    return;
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
