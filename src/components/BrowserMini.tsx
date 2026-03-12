import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { SearchField, Text } from "../ds";
import { t } from "../i18n";
import { formatNoteDate } from "../lib/text";
import { noteListAtom } from "../state/notes";
import { ultrawideBrowserSearch, useNoteSearch } from "../state/search";
import { weekStartAtom } from "../state/ui";
import { CalendarGrid } from "./CalendarGrid";
import { NoteCardCondensed } from "./NoteCardCondensed";

export type BrowserMiniProps = {
  onOpenNote: (relativePath: string) => void;
};

export function BrowserMini({ onOpenNote }: BrowserMiniProps) {
  const { query, search, results } = useNoteSearch(ultrawideBrowserSearch);
  const allNotes = useAtomValue(noteListAtom);
  const weekStart = useAtomValue(weekStartAtom);

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

  const noteCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const n of monthNotes) {
      if (!n.date) continue;
      const day = n.date.getUTCDate();
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return counts;
  }, [monthNotes]);

  const activeDays = useMemo(() => {
    if (!query.trim()) return null;
    return new Set(results.filter((r) => r.date).map((r) => r.date!.getUTCDate()));
  }, [query, results]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-2 shrink-0">
        <SearchField
          value={query}
          onChange={search}
          placeholder={t("search.placeholder")}
          label={t("search.label")}
          clearLabel={t("search.clear")}
        />
      </div>

      <div className="px-2 shrink-0">
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
      </div>

      <div className="flex-1 overflow-auto px-1 py-1">
        {filteredResults.length === 0 ? (
          <Text variant="body-dim" className="text-xs px-2 py-4 text-center">
            {query.trim() ? t("notes.noResults", { query }) : t("notes.empty")}
          </Text>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredResults.map((entry) => (
              <NoteCardCondensed
                key={entry.path}
                title={entry.title}
                date={formatNoteDate(entry.date)}
                onOpen={() => onOpenNote(entry.relativePath)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
