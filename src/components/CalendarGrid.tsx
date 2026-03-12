import { IconButton, Text } from "../ds";
import { t } from "../i18n";

export type CalendarGridProps = {
  year: number;
  month: number;
  weekStart: number;
  noteCounts: Map<number, number>;
  activeDays: Set<number> | null;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  onChangeMonth: (delta: number) => void;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "narrow" });

// All 7 day labels starting from Sunday (index 0). Jan 4 1970 is a Sunday.
const ALL_DAY_LABELS = Array.from({ length: 7 }, (_, i) =>
  dayFormatter.format(new Date(1970, 0, 4 + i)),
);

function rotatedDayLabels(weekStart: number): string[] {
  return [...ALL_DAY_LABELS.slice(weekStart), ...ALL_DAY_LABELS.slice(0, weekStart)];
}

function densityClass(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "w-1 h-1";
  if (count <= 3) return "w-1.5 h-1.5";
  return "w-2 h-2";
}

export function CalendarGrid({
  year,
  month,
  weekStart,
  noteCounts,
  activeDays,
  selectedDay,
  onSelectDay,
  onChangeMonth,
}: CalendarGridProps) {
  const jsFirstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = (jsFirstDay - weekStart + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = monthFormatter.format(new Date(year, month));
  const labels = rotatedDayLabels(weekStart);

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <IconButton
          icon="chevron-left"
          size="sm"
          aria-label={t("calendar.previousMonth")}
          onClick={() => onChangeMonth(-1)}
        />
        <Text variant="h4" as="span" className="text-sm">
          {monthName} {year}
        </Text>
        <IconButton
          icon="chevron-right"
          size="sm"
          aria-label={t("calendar.nextMonth")}
          onClick={() => onChangeMonth(1)}
        />
      </div>

      <div className="grid grid-cols-7 gap-px">
        {labels.map((label, i) => (
          <div
            key={`${label}-${String(i)}`}
            className="text-center text-xs font-medium text-muted py-1 select-none"
          >
            {label}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${String(i)}`} className="h-8" />;
          }

          const count = noteCounts.get(day) ?? 0;
          const isSelected = selectedDay === day;
          const isDimmed = activeDays !== null && !activeDays.has(day);
          const dot = densityClass(count);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={[
                "relative flex flex-col items-center justify-center h-8 rounded-md text-xs transition-colors duration-150",
                isSelected
                  ? "bg-accent text-white dark:text-black"
                  : "hover:bg-surface-2 text-paper",
                isDimmed && !isSelected ? "text-muted" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={t("calendar.dayLabel", {
                month: monthName,
                day: String(day),
                count,
              })}
              aria-pressed={isSelected}
            >
              <span>{day}</span>
              {count > 0 && (
                <span
                  className={[
                    "absolute bottom-0.5 rounded-full",
                    dot,
                    isSelected ? "bg-white dark:bg-black" : "bg-accent",
                    isDimmed && !isSelected ? "bg-muted" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
