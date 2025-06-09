import { createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const store = createStore();

export const selectedRepoAtom = atomWithStorage<{ owner: string; repo: string } | null>(
  "selectedRepo",
  null,
);

enum AppState {
  Unauthenticated,
  Authenticated,
  RepoSelected,
  RepoFetched,
}

export const appStateAtom = atomWithStorage<AppState>("appState", AppState.Unauthenticated);

export const userAtom = atomWithStorage<{
  username: string;
  token: string;
  installationId: string;
  email: string;
} | null>("githubUser", null);

window.addEventListener("load", () => {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    const username = params.get("username");
    const email = params.get("email");
    const installationId = params.get("app_install_id");

    if (token && username && installationId && email) {
      store.set(userAtom, { username, token, installationId, email });
      // Clear the URL hash after extracting the data
      window.history.replaceState(null, "", window.location.pathname);
    }
  }
});
