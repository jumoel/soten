import { atom } from "jotai";
import { getRepoWorker } from "../worker/client";
import { store, noteListAtom } from "./store";
import type { NoteListEntry } from "./store";

export const searchQueryAtom = atom("");
export const searchIndexReadyAtom = atom(false);

const searchMatchPathsAtom = atom<string[] | null>(null);

export const searchResultsAtom = atom<NoteListEntry[]>((get) => {
  const query = get(searchQueryAtom);
  const notes = get(noteListAtom);

  if (!query.trim()) return notes;

  const paths = get(searchMatchPathsAtom);
  if (!paths) return notes;

  const entryMap = new Map(notes.map((e) => [e.path, e]));
  return paths.map((p) => entryMap.get(p)).filter((e): e is NoteListEntry => e != null);
});

let searchSubscribed = false;

export function initSearchSubscription(): void {
  if (searchSubscribed) return;
  searchSubscribed = true;

  store.sub(searchQueryAtom, () => {
    const query = store.get(searchQueryAtom);

    if (!query.trim()) {
      store.set(searchMatchPathsAtom, null);
      return;
    }

    getRepoWorker()
      .search(query)
      .then((paths) => {
        if (store.get(searchQueryAtom) === query) {
          store.set(searchMatchPathsAtom, paths);
        }
      });
  });
}

function toSearchEntries(entries: NoteListEntry[]) {
  return entries.map((e) => ({ path: e.path, title: e.title }));
}

export async function buildSearchIndex(entries: NoteListEntry[]): Promise<void> {
  await getRepoWorker().buildSearchIndex(toSearchEntries(entries));
  store.set(searchIndexReadyAtom, true);
}

export async function updateSearchIndex(
  oldFilenames: string[],
  newFilenames: string[],
  entries: NoteListEntry[],
): Promise<void> {
  await getRepoWorker().updateSearchIndex(oldFilenames, newFilenames, toSearchEntries(entries));
  store.set(searchIndexReadyAtom, true);
}

export function clearSearchIndex(): void {
  store.set(searchIndexReadyAtom, false);
  store.set(searchQueryAtom, "");
  store.set(searchMatchPathsAtom, null);
  getRepoWorker().clearSearchIndex();
}
