import { useCallback, useMemo, useState } from "react";
import type { NoteListEntry } from "../state/notes";

export function useCalendarNavigation() {
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);

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
      setSelectedRange(null);
    },
    [calMonth, calYear],
  );

  return { calYear, calMonth, selectedRange, setSelectedRange, handleChangeMonth };
}

export function useMonthNotes(allNotes: NoteListEntry[], calYear: number, calMonth: number) {
  return useMemo(
    () =>
      allNotes.filter(
        (n) => n.date && n.date.getUTCFullYear() === calYear && n.date.getUTCMonth() === calMonth,
      ),
    [allNotes, calYear, calMonth],
  );
}

export function useCalendarData(entries: NoteListEntry[], searchResults: NoteListEntry[]) {
  return useMemo(() => {
    const noteCounts = new Map<number, number>();
    for (const entry of entries) {
      if (!entry.date) continue;
      const day = entry.date.getUTCDate();
      noteCounts.set(day, (noteCounts.get(day) ?? 0) + 1);
    }

    const activeDays =
      searchResults.length < entries.length
        ? new Set(searchResults.filter((r) => r.date).map((r) => r.date!.getUTCDate()))
        : null;

    return { noteCounts, activeDays };
  }, [entries, searchResults]);
}

export function useFilteredByDay(
  results: NoteListEntry[],
  selectedRange: [number, number] | null,
  calYear: number,
  calMonth: number,
) {
  return useMemo(() => {
    if (selectedRange === null) return results;
    const [min, max] = selectedRange;
    return results.filter(
      (r) =>
        r.date &&
        r.date.getUTCFullYear() === calYear &&
        r.date.getUTCMonth() === calMonth &&
        r.date.getUTCDate() >= min &&
        r.date.getUTCDate() <= max,
    );
  }, [results, selectedRange, calYear, calMonth]);
}
