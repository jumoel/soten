import { fetchCurrentUser } from "../lib/github";
import { store, machineAtom, userAtom } from "./store";
import { send } from "./machine";

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

  if (token) {
    try {
      const currentUser = await fetchCurrentUser(token);

      if (currentUser?.login) {
        await send({ type: "AUTHENTICATE", user });
      } else {
        store.set(userAtom, null);
        store.set(machineAtom, { phase: "unauthenticated", authError: null });
      }
    } catch {
      store.set(userAtom, null);
      store.set(machineAtom, { phase: "unauthenticated", authError: null });
    }
  } else {
    store.set(machineAtom, { phase: "unauthenticated", authError: null });
  }
}
