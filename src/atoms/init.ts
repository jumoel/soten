import { fetchCurrentUser } from "../lib/github";
import { store, AppState, appStateAtom, userAtom } from "./store";
import { dispatch, Event } from "./events";

function parseOAuthHash(): {
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

async function router() {
  const path = window.location.hash.substring(1);

  if (path === "/") {
    await dispatch(Event.ShowFront);
  } else {
    await dispatch(Event.ShowNote, { path });
  }
}

async function init() {
  const oauthParams = parseOAuthHash();

  if (oauthParams) {
    await dispatch(Event.Authenticated, oauthParams);
    window.history.replaceState(null, "", window.location.pathname);
    store.set(appStateAtom, AppState.Initialized);
    return;
  }

  const user = store.get(userAtom);
  const token = user?.token;

  if (token) {
    const currentUser = await fetchCurrentUser(token);

    if (currentUser?.login) {
      await dispatch(Event.Authenticated, user);
    } else {
      await dispatch(Event.Logout);
    }
  } else {
    await dispatch(Event.Logout);
  }

  store.set(appStateAtom, AppState.Initialized);

  if (window.location.hash) {
    await router();
  }
}

window.addEventListener("hashchange", router);

await init();
