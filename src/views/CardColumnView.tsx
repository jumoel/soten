import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarGrid } from "../components/CalendarGrid";
import { FAB } from "../components/FAB";
import { NoteCard } from "../components/NoteCard";
import { OpenNotePanel } from "../components/OpenNotePanel";
import { SearchField, Select, Text } from "../ds";
import {
  useCalendarData,
  useCalendarNavigation,
  useFilteredByDay,
  useMonthNotes,
} from "../hooks/useCalendar";
import { t } from "../i18n";
import { pfs } from "../lib/fs";
import { buildHash, type Route, routeAtom } from "../lib/router";
import { formatNoteDate, frontmatterEndLine } from "../lib/text";
import { renderMarkdown } from "../markdown";
import type { NoteListEntry } from "../state/notes";
import { noteListAtom, pinnedNotesAtom } from "../state/notes";
import { browserSearch, type SortOrder, useNoteSearch } from "../state/search";
import { store } from "../state/store";
import { conflictsAtom } from "../state/sync";
import { calendarOpenAtom, weekStartAtom } from "../state/ui";

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
          const markdown = lines.slice(start).join("\n");
          const rendered = await renderMarkdown(markdown);
          return [entry.path, rendered.html] as const;
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
  conflictPaths,
  openPath,
  urlParams,
}: {
  entries: NoteListEntry[];
  onUnpin: (path: string) => void;
  previews: Map<string, string>;
  conflictPaths: Set<string>;
  openPath: string | null;
  urlParams: Record<string, string | undefined>;
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
        <div className="grid grid-cols-1 gap-3">
          {entries.map((entry) => (
            <NoteCard
              key={entry.path}
              title={entry.title}
              date={formatNoteDate(entry.date)}
              previewHtml={previews.get(entry.path) ?? ""}
              isPinned={true}
              isDraft={false}
              hasConflict={conflictPaths.has(entry.path)}
              onPin={() => onUnpin(entry.path)}
              onOpen={() => {
                window.location.hash = buildHash(entry.relativePath, urlParams);
              }}
              highlight={openPath === entry.relativePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CardColumnView() {
  const route = useAtomValue(routeAtom);

  // Extract initial search/calendar from URL
  const routeQuery = route.view !== "settings" ? route.query : undefined;
  const routeCalFrom = route.view !== "settings" ? route.calFrom : undefined;
  const routeCalTo = route.view !== "settings" ? route.calTo : undefined;
  const routeCalMonth = route.view !== "settings" ? route.calMonth : undefined;

  const { query, search, sort, setSort, results } = useNoteSearch(browserSearch);
  const allNotes = useAtomValue(noteListAtom);
  const pinnedPaths = useAtomValue(pinnedNotesAtom);
  const setPinned = useSetAtom(pinnedNotesAtom);
  const weekStart = useAtomValue(weekStartAtom);
  const conflicts = useAtomValue(conflictsAtom);
  const conflictPaths = useMemo(() => new Set(conflicts.map((c) => c.path)), [conflicts]);
  const previews = useNotePreviews(allNotes);
  const sortOptions = useSortOptions(query.trim().length > 0);

  const { calYear, calMonth, selectedRange, setSelectedRange, handleChangeMonth } =
    useCalendarNavigation();
  const monthNotes = useMonthNotes(allNotes, calYear, calMonth);
  const { noteCounts, activeDays } = useCalendarData(monthNotes, results);
  const filteredResults = useFilteredByDay(results, selectedRange, calYear, calMonth);

  // Sync search from URL on initial load
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      if (routeQuery && routeQuery !== query) {
        search(routeQuery);
      }
      setInitialized(true);
    }
  }, [initialized, routeQuery, query, search]);

  // Determine which note is open
  const noteRoute =
    route.view === "note" || route.view === "draft"
      ? (route as Extract<Route, { view: "note" | "draft" }>)
      : null;

  const openPath = useMemo(() => {
    if (!noteRoute) return null;
    if (noteRoute.view === "note") return noteRoute.path;
    return `${noteRoute.timestamp}.md`;
  }, [noteRoute]);

  // Build URL params to preserve across navigation
  const urlParams = useMemo(
    () => ({
      q: query || undefined,
      from: routeCalFrom,
      to: routeCalTo,
      month: routeCalMonth,
    }),
    [query, routeCalFrom, routeCalTo, routeCalMonth],
  );

  const pinnedSet = useMemo(() => new Set(pinnedPaths), [pinnedPaths]);

  const pinnedEntries = useMemo(
    () => allNotes.filter((r) => pinnedSet.has(r.path)),
    [allNotes, pinnedSet],
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

  const handleNewNote = useCallback(() => {
    const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    window.location.hash = buildHash(`${ts}.md`, { ...urlParams, draft: ts });
  }, [urlParams]);

  const handleSearch = useCallback(
    (value: string) => {
      search(value);
      // Update URL with search query without navigation
      const newParams = { ...urlParams, q: value || undefined };
      const hashPath = openPath ?? undefined;
      const newHash = buildHash(hashPath, {
        ...newParams,
        draft:
          noteRoute?.view === "draft"
            ? noteRoute.timestamp
            : noteRoute?.view === "note"
              ? noteRoute.draft
              : undefined,
      });
      history.replaceState(null, "", newHash);
    },
    [search, urlParams, openPath, noteRoute],
  );

  const calendarPref = useAtomValue(calendarOpenAtom);
  const calendarOpen =
    calendarPref !== null
      ? calendarPref
      : typeof window !== "undefined" && window.innerWidth >= 1200;

  const calendarWidget = (
    <CalendarGrid
      year={calYear}
      month={calMonth}
      weekStart={weekStart}
      noteCounts={noteCounts}
      activeDays={query.trim() ? activeDays : null}
      selectedRange={selectedRange}
      onSelectRange={setSelectedRange}
      onChangeMonth={handleChangeMonth}
    />
  );

  const noteListColumn = (
    <div className="flex flex-col gap-4">
      {/* Search + sort */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchField
            value={query}
            onChange={handleSearch}
            placeholder={t("search.placeholder")}
            label={t("search.label")}
            clearLabel={t("search.clear")}
          />
        </div>
        <Select value={sort} onChange={setSort} options={sortOptions} label={t("sort.label")} />
      </div>

      {/* Pinned section */}
      <PinnedSection
        entries={pinnedEntries}
        onUnpin={togglePin}
        previews={previews}
        conflictPaths={conflictPaths}
        openPath={openPath}
        urlParams={urlParams}
      />

      {/* Unpinned grid */}
      {unpinnedEntries.length === 0 && pinnedEntries.length === 0 ? (
        <div className="py-8 text-center">
          <Text variant="body-dim">
            {query.trim() ? t("notes.noResults", { query }) : t("notes.empty")}
          </Text>
        </div>
      ) : (
        <div className={`grid gap-3 ${noteRoute ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {unpinnedEntries.map((entry) => (
            <NoteCard
              key={entry.path}
              title={entry.title}
              date={formatNoteDate(entry.date)}
              previewHtml={previews.get(entry.path) ?? ""}
              isPinned={false}
              isDraft={false}
              hasConflict={conflictPaths.has(entry.path)}
              onPin={() => togglePin(entry.path)}
              onOpen={() => {
                window.location.hash = buildHash(entry.relativePath, urlParams);
              }}
              highlight={openPath === entry.relativePath}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-10 py-4 flex gap-6">
          {/* Calendar sidebar - side by side on desktop+ */}
          {calendarOpen && (
            <div className="hidden xl:block shrink-0 w-72 sticky top-4 self-start">
              {calendarWidget}
            </div>
          )}

          {noteRoute ? (
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {/* Calendar stacked on mobile/tablet */}
              {calendarOpen && <div className="xl:hidden">{calendarWidget}</div>}

              <div className="flex flex-col xl:flex-row gap-6">
                <div className="xl:w-[52rem] xl:shrink-0 xl:sticky xl:top-4 xl:self-start">
                  <OpenNotePanel route={noteRoute} urlParams={urlParams} />
                </div>
                <div className="flex-1 min-w-0">{noteListColumn}</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {/* Calendar stacked on mobile/tablet */}
              {calendarOpen && <div className="xl:hidden">{calendarWidget}</div>}
              {noteListColumn}
            </div>
          )}
        </div>
      </main>

      <FAB onClick={handleNewNote} />
    </>
  );
}
