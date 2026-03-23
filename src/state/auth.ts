import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { t } from "../i18n";
import { fetchUserRepos, redirectToGitHubAuth } from "../lib/github";
import { beginRepoFlow, resetRepo } from "./repo";
import { store } from "./store";

export type AuthState = "unauthenticated" | "authenticating" | "authenticated" | "error";

export type User = {
  username: string;
  token: string;
  installationId: string;
  email: string;
};

export const authStateAtom = atom<AuthState>("unauthenticated");
export const userAtom = atomWithStorage<User | null>("user", null, undefined, { getOnInit: true });
export const authErrorAtom = atom<string | null>(null);

export function login(): void {
  redirectToGitHubAuth();
}

export async function authenticate(user: User): Promise<void> {
  store.set(userAtom, user);
  store.set(authStateAtom, "authenticating");
  store.set(authErrorAtom, null);

  try {
    const repos = await fetchUserRepos(user.installationId, user.token);
    if (!repos) {
      store.set(authStateAtom, "error");
      store.set(authErrorAtom, t("error.fetchReposFailed"));
      return;
    }

    if (repos.length === 0) {
      store.set(authStateAtom, "error");
      store.set(authErrorAtom, t("error.noRepos"));
      return;
    }

    await beginRepoFlow(user, repos);
  } catch (e) {
    store.set(authStateAtom, "error");
    store.set(authErrorAtom, e instanceof Error ? e.message : String(e));
  }
}

export function logout(): void {
  store.set(userAtom, null);
  store.set(authStateAtom, "unauthenticated");
  store.set(authErrorAtom, null);
  resetRepo();
}
