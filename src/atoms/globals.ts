import { createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readRepoDir } from "../lib/fs";

export const store = createStore();

export const selectedRepoAtom = atomWithStorage<{ owner: string; repo: string } | null>(
  "selectedRepo",
  null,
);

export enum AuthState {
  Unauthenticated,
  Authenticated,
}

export const authStateAtom = atomWithStorage<AuthState>("authState", AuthState.Unauthenticated);

export enum RepoState {
  Unselected,
  Selected,
  Fetched,
}

export const repoStateAtom = atomWithStorage<RepoState>("repoState", RepoState.Unselected);

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
      store.set(authStateAtom, AuthState.Authenticated);

      // Clear the URL hash after extracting the data
      window.history.replaceState(null, "", window.location.pathname);
    }
  }
});

store.sub(authStateAtom, async () => {
  if (store.get(authStateAtom) !== AuthState.Authenticated) {
    return;
  }

  const user = store.get(userAtom);
  if (!user) {
    console.error("User data is not available after authentication.");
    return;
  }

  const repos = await fetchUserRepos(user.installationId, user.token);
  if (!repos) {
    console.error("Failed to fetch user repositories.");
    return;
  }

  if (repos.length > 0) {
    const [owner, repo] = repos[0].split("/");
    store.set(selectedRepoAtom, { owner, repo });
    store.set(repoStateAtom, RepoState.Selected);
  } else {
    console.warn("No repositories found for the authenticated user.");
    store.set(selectedRepoAtom, null);
    store.set(repoStateAtom, RepoState.Unselected);
  }
});

store.sub(selectedRepoAtom, async () => {
  const selectedRepo = store.get(selectedRepoAtom);
  const repoState = store.get(repoStateAtom);
  const user = store.get(userAtom);

  if (repoState === RepoState.Unselected || !selectedRepo) {
    console.warn("No repository selected.");
    return;
  }
  if (!user) {
    console.error("User data is not available for cloning the repository.");
    return;
  }

  await git.clone(`https://github.com/${selectedRepo.owner}/${selectedRepo.repo}.git`, user);
  store.set(repoStateAtom, RepoState.Fetched);
});

store.sub(repoStateAtom, async () => {
  const repoState = store.get(repoStateAtom);
  if (repoState !== RepoState.Fetched) {
    return;
  }
});
