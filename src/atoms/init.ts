import { fetchCurrentUser } from "../lib/github";
import { store, cachedUserAtom } from "./store";
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
    await send({ type: "AUTH_ERROR", message: authError });
    window.history.replaceState(null, "", window.location.pathname);
    return;
  }

  const oauthParams = parseOAuthHash();

  if (oauthParams) {
    await send({ type: "AUTHENTICATED", user: oauthParams });
    window.history.replaceState(null, "", window.location.pathname);
    return;
  }

  const user = store.get(cachedUserAtom);
  const token = user?.token;

  if (token) {
    const currentUser = await fetchCurrentUser(token);

    if (currentUser?.login) {
      await send({ type: "AUTHENTICATED", user });
    } else {
      await send({ type: "NO_AUTH" });
    }
  } else {
    await send({ type: "NO_AUTH" });
  }
}
