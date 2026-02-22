import { createStore, atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

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

export enum AppView {
  Front = "Front",
  Note = "Note",
}
export const appViewAtom = atom<AppView>(AppView.Front);

export type TextFile = { type: "text"; content: string };
export type ImageFile = { type: "image"; content: Blob };

export type User = {
  username: string;
  token: string;
  installationId: string;
  email: string;
};

export const errorAtom = atom<string | null>(null);
export const authErrorAtom = atom<string | null>(null);
export const userAtom = atomWithStorage<User | null>("user", null, undefined, { getOnInit: true });
export const reposAtom = atom<string[]>([]);
export const selectedRepoAtom = atomWithStorage<{ owner: string; repo: string } | null>(
  "selectedRepo",
  null,
  undefined,
  { getOnInit: true },
);
export const repoFilenamesAtom = atom<string[]>([]);
export const filesAtom = atom<Record<string, TextFile | ImageFile>>({});
export const repoReadyAtom = atom<boolean>(false);
export const currentPathAtom = atom<string>("/");
