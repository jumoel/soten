import { createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const store = createStore();

export type TextFile = { type: "text"; content: string };
export type ImageFile = { type: "image"; content: Blob };

export type User = {
  username: string;
  token: string;
  installationId: string;
  email: string;
};

export const cachedUserAtom = atomWithStorage<User | null>("user", null, undefined, {
  getOnInit: true,
});
export const cachedRepoAtom = atomWithStorage<{ owner: string; repo: string } | null>(
  "selectedRepo",
  null,
  undefined,
  { getOnInit: true },
);
