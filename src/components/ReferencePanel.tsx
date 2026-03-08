import { useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { SearchBar } from "./SearchBar";
import { NoteRow } from "./NoteRow";
import { PinnedZone } from "./PinnedZone";
import { Text } from "./ds/Text";
import {
  searchResultsAtom,
  searchQueryAtom,
  sortAtom,
  pinnedNotesAtom,
  expandedNoteAtom,
  draftsAtom,
  openExistingDraft,
  restoreDraft,
} from "../atoms/globals";
import type { SortOrder } from "../atoms/globals";
import { store } from "../atoms/store";
import { readFile } from "../lib/fs";
import { getRepoWorker } from "../worker/client";
import { pathToTimestamp, timestampToPath } from "../lib/note-paths";
import { t } from "../i18n";

export function ReferencePanel() {
  const notes = useAtomValue(searchResultsAtom);
  const query = useAtomValue(searchQueryAtom);
  const [sort, setSort] = useAtom(sortAtom);
  const [pinnedPaths, setPinnedPaths] = useAtom(pinnedNotesAtom);
  const [expandedPath, setExpandedPath] = useAtom(expandedNoteAtom);
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/" });

  useEffect(() => {
    if (searchParams.note) {
      setExpandedPath(timestampToPath(searchParams.note));
    }
  }, []); // intentionally empty - restore expanded state from URL on mount only

  const pinnedNotes = notes.filter((n) => pinnedPaths.includes(n.path));

  const handleEdit = async (path: string) => {
    const timestamp = pathToTimestamp(path);
    if (!timestamp) return;

    const existing = store.get(draftsAtom).find((d) => d.timestamp === timestamp);
    if (existing) {
      restoreDraft(timestamp);
      void navigate({ to: "/", search: (prev) => ({ ...prev, draft: timestamp }) });
      return;
    }

    const file = await readFile(path);
    if (!file || file.type !== "text") return;

    const worker = getRepoWorker();
    await worker.createBranch(`draft/${timestamp}`);
    await worker.checkoutBranch(`draft/${timestamp}`);

    openExistingDraft(timestamp, file.content);
    void navigate({ to: "/", search: (prev) => ({ ...prev, draft: timestamp }) });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-base h-11 flex items-center gap-2 px-4 border-b border-edge">
        <SearchBar />
        <select
          className="text-xs text-muted bg-transparent border-none focus:outline-none cursor-pointer"
          value={sort === "best-match" && !query.trim() ? "newest" : sort}
          onChange={(e) => setSort(e.target.value as SortOrder)}
        >
          <option value="newest">{t("sort.newest")}</option>
          <option value="oldest">{t("sort.oldest")}</option>
          {query.trim() ? <option value="best-match">{t("sort.bestMatch")}</option> : null}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pinnedPaths.length > 0 && (
          <>
            <PinnedZone
              notes={pinnedNotes}
              onUnpin={(path) => setPinnedPaths((ps) => ps.filter((p) => p !== path))}
              onEdit={(path) => void handleEdit(path)}
            />
            <div className="border-b border-edge" />
          </>
        )}

        {notes.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <Text variant="secondary" className="text-center">
              {query ? t("notes.noResults", { query }) : t("notes.empty")}
            </Text>
          </div>
        ) : (
          <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {notes.map((note) => (
              <NoteRow
                key={note.path}
                note={note}
                expanded={expandedPath === note.path}
                onExpand={() => {
                  const next = expandedPath === note.path ? null : note.path;
                  setExpandedPath(next);
                  const ts = next ? (pathToTimestamp(note.path) ?? undefined) : undefined;
                  void navigate({ to: "/", search: (prev) => ({ ...prev, note: ts }) });
                }}
                onPin={() => {
                  setPinnedPaths((ps) => (ps.includes(note.path) ? ps : [...ps, note.path]));
                  setExpandedPath(null);
                }}
                onEdit={() => void handleEdit(note.path)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
