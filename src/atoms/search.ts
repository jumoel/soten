import MiniSearch from "minisearch";
import { atom } from "jotai";
import { readFile } from "../lib/fs";
import { store, noteListAtom, findBodyStart, selectedRepoAtom } from "./store";
import type { NoteListEntry } from "./store";

const STORAGE_KEY = "searchIndex";
const FIELDS = ["title", "body"] as const;
const STORE_FIELDS = ["title"] as const;

type IndexDoc = { id: string; title: string; body: string };

let searchIndex: MiniSearch | null = null;

export const searchQueryAtom = atom("");
export const searchIndexReadyAtom = atom(false);

export const searchResultsAtom = atom<NoteListEntry[]>((get) => {
  const query = get(searchQueryAtom);
  const notes = get(noteListAtom);
  get(searchIndexReadyAtom);

  if (!query.trim() || !searchIndex) return notes;

  const results = searchIndex.search(query, {
    prefix: true,
    fuzzy: 0.2,
    boost: { title: 2 },
  });

  const entryMap = new Map(notes.map((e) => [e.path, e]));
  return results.map((r) => entryMap.get(r.id)).filter((e): e is NoteListEntry => e != null);
});

function cacheKey(): string | null {
  const repo = store.get(selectedRepoAtom);
  if (!repo) return null;
  return `${STORAGE_KEY}:${repo.owner}/${repo.repo}`;
}

function persistIndex(): void {
  const key = cacheKey();
  if (!key || !searchIndex) return;
  try {
    localStorage.setItem(key, JSON.stringify(searchIndex));
  } catch {
    // quota exceeded — cache is best-effort
  }
}

function loadCachedIndex(): boolean {
  const key = cacheKey();
  if (!key) return false;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    searchIndex = MiniSearch.loadJSON<IndexDoc>(raw, {
      fields: [...FIELDS],
      storeFields: [...STORE_FIELDS],
    });
    return true;
  } catch {
    return false;
  }
}

function clearCachedIndex(): void {
  const key = cacheKey();
  if (key) localStorage.removeItem(key);
}

export async function buildSearchIndex(entries: NoteListEntry[]): Promise<void> {
  if (loadCachedIndex()) {
    store.set(searchIndexReadyAtom, true);
    rebuildInBackground(entries);
    return;
  }

  await fullBuild(entries);
  persistIndex();
}

async function fullBuild(entries: NoteListEntry[]): Promise<void> {
  const index = new MiniSearch<IndexDoc>({
    fields: [...FIELDS],
    storeFields: [...STORE_FIELDS],
  });

  const docs: IndexDoc[] = [];

  for (const entry of entries) {
    const file = await readFile(entry.path);
    if (!file || file.type !== "text") continue;
    const bodyStart = findBodyStart(file.content);
    docs.push({ id: entry.path, title: entry.title, body: file.content.slice(bodyStart) });
  }

  index.addAll(docs);
  searchIndex = index;
  store.set(searchIndexReadyAtom, true);
}

async function rebuildInBackground(entries: NoteListEntry[]): Promise<void> {
  await fullBuild(entries);
  persistIndex();
}

export async function updateSearchIndex(
  oldFilenames: string[],
  newFilenames: string[],
): Promise<void> {
  if (!searchIndex) return;

  const oldSet = new Set(oldFilenames);
  const newSet = new Set(newFilenames);

  for (const path of oldFilenames) {
    if (!newSet.has(path)) {
      try {
        searchIndex.discard(path);
      } catch {
        // document may not be in index
      }
    }
  }

  const noteList = store.get(noteListAtom);
  const noteMap = new Map(noteList.map((e) => [e.path, e]));

  for (const path of newFilenames) {
    if (!oldSet.has(path)) {
      const entry = noteMap.get(path);
      if (!entry) continue;
      const file = await readFile(path);
      if (!file || file.type !== "text") continue;
      const bodyStart = findBodyStart(file.content);
      searchIndex.add({ id: path, title: entry.title, body: file.content.slice(bodyStart) });
    }
  }

  store.set(searchIndexReadyAtom, true);
  persistIndex();
}

export function clearSearchIndex(): void {
  clearCachedIndex();
  searchIndex = null;
  store.set(searchIndexReadyAtom, false);
  store.set(searchQueryAtom, "");
}
