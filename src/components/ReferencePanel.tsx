import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchField, Text } from "../ds";
import { t } from "../i18n";
import { pfs } from "../lib/fs";
import type { NoteListEntry } from "../state/notes";
import { noteListAtom } from "../state/notes";
import { referenceSearch, useNoteSearch } from "../state/search";
import { type ReferenceMode, referenceStackAtom } from "../state/ui";
import { NoteCardCondensed } from "./NoteCardCondensed";
import { ReferenceCard } from "./ReferenceCard";

const prettyDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return prettyDate.format(date);
}

function useNoteContents(paths: string[]) {
  const [contents, setContents] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const missing = paths.filter((p) => !contents.has(p));
    if (missing.length === 0) return;

    Promise.allSettled(
      missing.map(async (path) => {
        const text = await pfs.readFile(path, { encoding: "utf8" });
        return [path, text] as const;
      }),
    ).then((results) => {
      if (cancelled) return;
      setContents((prev) => {
        const next = new Map(prev);
        for (const r of results) {
          if (r.status === "fulfilled") next.set(r.value[0], r.value[1]);
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [paths, contents]);

  return contents;
}

export type ReferencePanelProps = {
  /** Current note's path - excluded from search results. */
  currentPath?: string;
  /** Ref callback to focus the search field (Cmd+K). */
  searchRef?: React.RefObject<HTMLInputElement | null>;
};

export function ReferencePanel({ currentPath, searchRef }: ReferencePanelProps) {
  const { query, search, results } = useNoteSearch(referenceSearch);
  const allNotes = useAtomValue(noteListAtom);
  const stack = useAtomValue(referenceStackAtom);
  const setStack = useSetAtom(referenceStackAtom);

  const noteMap = useMemo(() => {
    const m = new Map<string, NoteListEntry>();
    for (const n of allNotes) m.set(n.path, n);
    return m;
  }, [allNotes]);

  const stackPaths = useMemo(() => stack.map((e) => e.path), [stack]);
  const contents = useNoteContents(stackPaths);

  // Filter search results: exclude current note and already-stacked notes
  const filteredResults = useMemo(() => {
    const stackSet = new Set(stackPaths);
    return results.filter((r) => r.path !== currentPath && !stackSet.has(r.path));
  }, [results, currentPath, stackPaths]);

  const addToStack = useCallback(
    (path: string) => {
      setStack((prev) => {
        if (prev.some((e) => e.path === path)) return prev;
        return [...prev, { path, mode: "excerpt" as ReferenceMode }];
      });
    },
    [setStack],
  );

  const changeMode = useCallback(
    (path: string, mode: ReferenceMode) => {
      setStack((prev) => prev.map((e) => (e.path === path ? { ...e, mode } : e)));
    },
    [setStack],
  );

  const dismiss = useCallback(
    (path: string) => {
      setStack((prev) => prev.filter((e) => e.path !== path));
    },
    [setStack],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 shrink-0">
        <SearchField
          ref={searchRef}
          value={query}
          onChange={search}
          placeholder={t("reference.searchPlaceholder")}
          label={t("reference.searchLabel")}
          clearLabel={t("reference.searchClear")}
        />
      </div>

      <div className="flex-1 overflow-auto px-3 pb-3">
        {/* Search results */}
        {query.trim() && (
          <div className="flex flex-col gap-0.5 mb-3">
            {filteredResults.length === 0 ? (
              <Text variant="body-dim" className="text-xs px-2 py-1">
                {t("notes.noResults", { query })}
              </Text>
            ) : (
              filteredResults.slice(0, 20).map((entry) => (
                <NoteCardCondensed
                  key={entry.path}
                  title={entry.title}
                  date={formatDate(entry.date)}
                  onOpen={() => {
                    addToStack(entry.path);
                  }}
                  onAdd={() => addToStack(entry.path)}
                />
              ))
            )}
          </div>
        )}

        {/* Reference stack */}
        {stack.length === 0 && !query.trim() ? (
          <Text variant="body-dim" className="text-xs px-2 py-4 text-center">
            {t("reference.empty")}
          </Text>
        ) : (
          <div className="flex flex-col gap-2">
            {stack.map((entry) => {
              const note = noteMap.get(entry.path);
              return (
                <ReferenceCard
                  key={entry.path}
                  title={note?.title ?? entry.path}
                  date={note?.date ? formatDate(note.date) : null}
                  content={contents.get(entry.path) ?? ""}
                  mode={entry.mode}
                  onChangeMode={(mode) => changeMode(entry.path, mode)}
                  onDismiss={() => dismiss(entry.path)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
