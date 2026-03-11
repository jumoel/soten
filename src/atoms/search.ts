import { atom } from "jotai";
import { getRepoWorker } from "../worker/client";
import type { NoteListEntry } from "./store";
import { noteListAtom, store } from "./store";

export const searchQueryAtom = atom("");
export const searchIndexReadyAtom = atom(false);

export type SortOrder = "newest" | "oldest" | "best-match";
export const sortAtom = atom<SortOrder>("newest");

const searchMatchPathsAtom = atom<string[] | null>(null);

const rawSearchResultsAtom = atom<NoteListEntry[]>((get) => {
  const query = get(searchQueryAtom);
  const notes = get(noteListAtom);

  if (!query.trim()) return notes;

  const paths = get(searchMatchPathsAtom);
  if (!paths) return notes;

  const entryMap = new Map(notes.map((e) => [e.path, e]));
  return paths.map((p) => entryMap.get(p)).filter((e): e is NoteListEntry => e != null);
});

export const searchResultsAtom = atom<NoteListEntry[]>((get) => {
  const entries = get(rawSearchResultsAtom);
  const sort = get(sortAtom);
  const query = get(searchQueryAtom);

  if (sort === "best-match" && query.trim()) return entries;

  const sorted = [...entries];
  const direction = sort === "oldest" ? 1 : -1;

  sorted.sort((a, b) => {
    if (a.date && b.date) return direction * (a.date.getTime() - b.date.getTime());
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return direction * a.relativePath.localeCompare(b.relativePath);
  });

  return sorted;
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
