import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { getRepoWorker } from "../worker/client";
import type { SearchResult } from "../worker/protocol";
import type { NoteListEntry } from "./notes";
import { noteListAtom } from "./notes";
import { store } from "./store";

export type SortOrder = "newest" | "oldest" | "best-match";

export async function buildSearchIndex(entries: NoteListEntry[]): Promise<void> {
  await getRepoWorker().buildSearchIndex(entries.map((e) => ({ path: e.path, title: e.title })));
}

export async function updateSearchIndex(
  oldFilenames: string[],
  newFilenames: string[],
  entries: NoteListEntry[],
): Promise<void> {
  await getRepoWorker().updateSearchIndex(
    oldFilenames,
    newFilenames,
    entries.map((e) => ({ path: e.path, title: e.title })),
  );
}

export function clearSearchIndex(): void {
  getRepoWorker().clearSearchIndex();
}

export function createSearchAtoms() {
  const queryAtom = atom("");
  const sortAtom = atom<SortOrder>("newest");
  const matchesAtom = atom<SearchResult[]>([]);

  const resultsAtom = atom<NoteListEntry[]>((get) => {
    const query = get(queryAtom);
    const notes = get(noteListAtom);
    const sort = get(sortAtom);
    const matches = get(matchesAtom);

    let filtered: NoteListEntry[];
    if (!query.trim()) {
      filtered = notes;
    } else {
      const scoreMap = new Map(matches.map((m) => [m.path, m.score]));
      filtered = notes
        .filter((n) => scoreMap.has(n.path))
        .sort((a, b) => (scoreMap.get(b.path) ?? 0) - (scoreMap.get(a.path) ?? 0));
    }

    if (sort === "best-match" && query.trim()) {
      // Already sorted by score above
    } else {
      const dir = sort === "oldest" ? 1 : -1;
      filtered = [...filtered].sort((a, b) => {
        if (a.date && b.date) return dir * (a.date.getTime() - b.date.getTime());
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;
        return dir * a.relativePath.localeCompare(b.relativePath);
      });
    }

    return filtered;
  });

  return { queryAtom, sortAtom, matchesAtom, resultsAtom };
}

export const browserSearch = createSearchAtoms();
export const referenceSearch = createSearchAtoms();
export const ultrawideBrowserSearch = createSearchAtoms();

export function useNoteSearch(atoms: ReturnType<typeof createSearchAtoms>) {
  const query = useAtomValue(atoms.queryAtom);
  const setQuery = useSetAtom(atoms.queryAtom);
  const sort = useAtomValue(atoms.sortAtom);
  const setSort = useSetAtom(atoms.sortAtom);
  const results = useAtomValue(atoms.resultsAtom);
  const setMatches = useSetAtom(atoms.matchesAtom);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(
    (value: string) => {
      setQuery(value);
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!value.trim()) {
        setMatches([]);
        return;
      }

      timerRef.current = setTimeout(() => {
        getRepoWorker()
          .search(value)
          .then((searchResults) => {
            if (store.get(atoms.queryAtom) === value) {
              setMatches(searchResults);
            }
          });
      }, 200);
    },
    [setQuery, setMatches, atoms.queryAtom],
  );

  return { query, search, sort, setSort, results };
}
