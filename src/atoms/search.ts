import MiniSearch from "minisearch";
import { atom } from "jotai";
import { readFile } from "../lib/fs";
import { store, noteListAtom, findBodyStart, selectedRepoAtom } from "./store";
import type { NoteListEntry } from "./store";

const STORAGE_KEY = "searchIndex";
const FIELDS = ["title", "body"];
const STORE_FIELDS = ["title"];

type IndexDoc = { id: string; title: string; body: string };

let searchIndex: MiniSearch | null = null;
let buildGeneration = 0;

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
      fields: FIELDS,
      storeFields: STORE_FIELDS,
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

async function buildDoc(entry: NoteListEntry): Promise<IndexDoc | null> {
  const file = await readFile(entry.path);
  if (!file || file.type !== "text") return null;
  const bodyStart = findBodyStart(file.content);
  return { id: entry.path, title: entry.title, body: file.content.slice(bodyStart) };
}

export async function buildSearchIndex(entries: NoteListEntry[]): Promise<void> {
  const gen = ++buildGeneration;

  if (loadCachedIndex()) {
    store.set(searchIndexReadyAtom, true);
    fullBuild(entries, gen).then(persistIndex);
    return;
  }

  await fullBuild(entries, gen);
  persistIndex();
}

async function fullBuild(entries: NoteListEntry[], gen: number): Promise<void> {
  const docs = (await Promise.all(entries.map(buildDoc))).filter((d): d is IndexDoc => d != null);

  if (gen !== buildGeneration) return;

  const index = new MiniSearch<IndexDoc>({ fields: FIELDS, storeFields: STORE_FIELDS });
  index.addAll(docs);
  searchIndex = index;
  store.set(searchIndexReadyAtom, true);
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
      searchIndex.discard(path);
    }
  }

  const noteList = store.get(noteListAtom);
  const noteMap = new Map(noteList.map((e) => [e.path, e]));

  const added = newFilenames.filter((p) => !oldSet.has(p));
  const entries = added.map((p) => noteMap.get(p)).filter((e): e is NoteListEntry => e != null);
  const docs = (await Promise.all(entries.map(buildDoc))).filter((d): d is IndexDoc => d != null);

  for (const doc of docs) {
    searchIndex.add(doc);
  }

  store.set(searchIndexReadyAtom, true);
  persistIndex();
}

export function clearSearchIndex(): void {
  buildGeneration++;
  clearCachedIndex();
  searchIndex = null;
  store.set(searchIndexReadyAtom, false);
  store.set(searchQueryAtom, "");
}
