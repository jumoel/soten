import { useAtom, useAtomValue } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { SearchBar } from "./SearchBar";
import { NoteRow } from "./NoteRow";
import { PinnedZone } from "./PinnedZone";
import { Text, Select } from "../design";
import {
  searchResultsAtom,
  searchQueryAtom,
  sortAtom,
  pinnedNotesAtom,
  draftsAtom,
  openExistingDraft,
  restoreDraft,
} from "../atoms/globals";
import type { SortOrder } from "../atoms/globals";
import { store } from "../atoms/store";
import { readFile } from "../lib/fs";
import { getRepoWorker } from "../worker/client";
import { pathToTimestamp } from "../lib/note-paths";
import { t } from "../i18n";

export function ReferencePanel() {
  const notes = useAtomValue(searchResultsAtom);
  const query = useAtomValue(searchQueryAtom);
  const [sort, setSort] = useAtom(sortAtom);
  const [pinnedPaths, setPinnedPaths] = useAtom(pinnedNotesAtom);
  const navigate = useNavigate();

  const pinnedNotes = notes.filter((n) => pinnedPaths.includes(n.path));

  const sortOptions = [
    { value: "newest", label: t("sort.newest") },
    { value: "oldest", label: t("sort.oldest") },
    ...(query.trim() ? [{ value: "best-match", label: t("sort.bestMatch") }] : []),
  ];

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
        <Select
          label={t("sort.label")}
          value={sort === "best-match" && !query.trim() ? "newest" : sort}
          onChange={(v) => setSort(v as SortOrder)}
          options={sortOptions}
          size="sm"
        />
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
            <Text variant="body-dim" as="p">
              {query ? t("notes.noResults", { query }) : t("notes.empty")}
            </Text>
          </div>
        ) : (
          <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {notes.map((note) => (
              <NoteRow
                key={note.path}
                note={note}
                onPin={() => setPinnedPaths((ps) => (ps.includes(note.path) ? ps : [...ps, note.path]))}
                onEdit={() => void handleEdit(note.path)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
