import { useAtomValue } from "jotai";
import { SearchField, Text } from "../ds";
import {
  useCalendarData,
  useCalendarNavigation,
  useFilteredByDay,
  useMonthNotes,
} from "../hooks/useCalendar";
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

  const { calYear, calMonth, selectedDay, setSelectedDay, handleChangeMonth } =
    useCalendarNavigation();
  const monthNotes = useMonthNotes(allNotes, calYear, calMonth);
  const { noteCounts, activeDays } = useCalendarData(monthNotes, results);
  const filteredResults = useFilteredByDay(results, selectedDay, calYear, calMonth);

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
