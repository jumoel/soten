import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarGrid } from "../components/CalendarGrid";
import { FAB } from "../components/FAB";
import { NoteCard } from "../components/NoteCard";
import { TopBar } from "../components/TopBar";
import { Button, IconButton, SearchField, Select, Text } from "../ds";
import { t } from "../i18n";
import { pfs } from "../lib/fs";
import { formatNoteDate, frontmatterEndLine } from "../lib/text";
import type { NoteListEntry } from "../state/notes";
import { noteListAtom, pinnedNotesAtom } from "../state/notes";
import { repoAtom } from "../state/repo";
import { browserSearch, type SortOrder, useNoteSearch } from "../state/search";
import { store } from "../state/store";
import { weekStartAtom } from "../state/ui";

function useNotePreviews(entries: NoteListEntry[]) {
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled(
        entries.slice(0, 50).map(async (entry) => {
          const content = await pfs.readFile(entry.path, { encoding: "utf8" });
          const lines = content.split("\n");
          const start = frontmatterEndLine(lines);
          const body = lines
            .slice(start)
            .filter((l: string) => l.trim().length > 0)
            .slice(0, 3)
            .join(" ")
            .slice(0, 200);
          return [entry.path, body] as const;
        }),
      );

      if (cancelled) return;
      const map = new Map<string, string>();
      for (const result of results) {
        if (result.status === "fulfilled") {
          map.set(result.value[0], result.value[1]);
        }
      }
      setPreviews(map);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [entries]);

  return previews;
}

function useCalendarData(entries: NoteListEntry[], searchResults: NoteListEntry[]) {
  return useMemo(() => {
    const noteCounts = new Map<number, number>();
    for (const entry of entries) {
      if (!entry.date) continue;
      const day = entry.date.getUTCDate();
      noteCounts.set(day, (noteCounts.get(day) ?? 0) + 1);
    }

    const searchPaths = new Set(searchResults.map((r) => r.path));
    const activeDays =
      searchResults.length < entries.length
        ? new Set(searchResults.filter((r) => r.date).map((r) => r.date!.getUTCDate()))
        : null;

    return { noteCounts, activeDays, searchPaths };
  }, [entries, searchResults]);
}

function useSortOptions(hasQuery: boolean) {
  const base = [
    { value: "newest" as SortOrder, label: t("sort.newest") },
    { value: "oldest" as SortOrder, label: t("sort.oldest") },
  ];
  if (hasQuery) base.push({ value: "best-match" as SortOrder, label: t("sort.bestMatch") });
  return base;
}

function PinnedSection({
  entries,
  onUnpin,
  previews,
}: {
  entries: NoteListEntry[];
  onUnpin: (path: string) => void;
  previews: Map<string, string>;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted hover:text-paper-dim"
      >
        <span>{collapsed ? "\u25B6" : "\u25BC"}</span>
        <span>
          {t("notes.pinned")} ({entries.length})
        </span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {entries.map((entry) => (
            <NoteCard
              key={entry.path}
              title={entry.title}
              date={formatNoteDate(entry.date)}
              preview={previews.get(entry.path) ?? ""}
              isPinned={true}
              isDraft={false}
              onPin={() => onUnpin(entry.path)}
              onOpen={() => {
                window.location.hash = `#/${entry.relativePath}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BrowserView() {
  const { query, search, sort, setSort, results } = useNoteSearch(browserSearch);
  const allNotes = useAtomValue(noteListAtom);
  const pinnedPaths = useAtomValue(pinnedNotesAtom);
  const setPinned = useSetAtom(pinnedNotesAtom);
  const repo = useAtomValue(repoAtom);
  const weekStart = useAtomValue(weekStartAtom);
  const previews = useNotePreviews(allNotes);
  const sortOptions = useSortOptions(query.trim().length > 0);

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthNotes = useMemo(
    () =>
      allNotes.filter(
        (n) => n.date && n.date.getUTCFullYear() === calYear && n.date.getUTCMonth() === calMonth,
      ),
    [allNotes, calYear, calMonth],
  );

  const { noteCounts, activeDays } = useCalendarData(monthNotes, results);

  const filteredResults = useMemo(() => {
    if (selectedDay === null) return results;
    return results.filter(
      (r) =>
        r.date &&
        r.date.getUTCFullYear() === calYear &&
        r.date.getUTCMonth() === calMonth &&
        r.date.getUTCDate() === selectedDay,
    );
  }, [results, selectedDay, calYear, calMonth]);

  const pinnedSet = useMemo(() => new Set(pinnedPaths), [pinnedPaths]);

  const pinnedEntries = useMemo(
    () => filteredResults.filter((r) => pinnedSet.has(r.path)),
    [filteredResults, pinnedSet],
  );
  const unpinnedEntries = useMemo(
    () => filteredResults.filter((r) => !pinnedSet.has(r.path)),
    [filteredResults, pinnedSet],
  );

  const togglePin = useCallback(
    (path: string) => {
      const current = store.get(pinnedNotesAtom);
      if (current.includes(path)) {
        setPinned(current.filter((p) => p !== path));
      } else {
        setPinned([...current, path]);
      }
    },
    [setPinned],
  );

  const handleChangeMonth = useCallback(
    (delta: number) => {
      let m = calMonth + delta;
      let y = calYear;
      if (m < 0) {
        m = 11;
        y--;
      } else if (m > 11) {
        m = 0;
        y++;
      }
      setCalMonth(m);
      setCalYear(y);
      setSelectedDay(null);
    },
    [calMonth, calYear],
  );

  const handleNewNote = useCallback(() => {
    const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    window.location.hash = `#/${ts}.md?draft=${ts}`;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-base">
      <TopBar
        left={
          <Text variant="h3" as="span" className="text-sm">
            {repo ? `${repo.owner}/${repo.repo}` : t("app.name")}
          </Text>
        }
        right={
          <div className="flex items-center gap-1">
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={handleNewNote}
              className="hidden md:flex"
            >
              {t("note.new")}
            </Button>
            <IconButton
              icon="settings"
              size="sm"
              aria-label={t("menu.settings")}
              onClick={() => {
                window.location.hash = "#/settings";
              }}
            />
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex flex-col gap-4">
          <CalendarGrid
            year={calYear}
            month={calMonth}
            weekStart={weekStart}
            noteCounts={noteCounts}
            activeDays={query.trim() ? activeDays : null}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onChangeMonth={handleChangeMonth}
          />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchField
                value={query}
                onChange={search}
                placeholder={t("search.placeholder")}
                label={t("search.label")}
                clearLabel={t("search.clear")}
              />
            </div>
            <Select value={sort} onChange={setSort} options={sortOptions} label={t("sort.label")} />
          </div>

          <PinnedSection entries={pinnedEntries} onUnpin={togglePin} previews={previews} />

          {unpinnedEntries.length === 0 && pinnedEntries.length === 0 ? (
            <div className="py-8 text-center">
              <Text variant="body-dim">
                {query.trim() ? t("notes.noResults", { query }) : t("notes.empty")}
              </Text>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {unpinnedEntries.map((entry) => (
                <NoteCard
                  key={entry.path}
                  title={entry.title}
                  date={formatNoteDate(entry.date)}
                  preview={previews.get(entry.path) ?? ""}
                  isPinned={false}
                  isDraft={false}
                  onPin={() => togglePin(entry.path)}
                  onOpen={() => {
                    window.location.hash = `#/${entry.relativePath}`;
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <FAB onClick={handleNewNote} />
    </div>
  );
}
