import { IconButton, Text } from "../ds";

export type CalendarGridProps = {
  year: number;
  month: number;
  noteCounts: Map<number, number>;
  activeDays: Set<number> | null;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  onChangeMonth: (delta: number) => void;
};

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function densityClass(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "w-1 h-1";
  if (count <= 3) return "w-1.5 h-1.5";
  return "w-2 h-2";
}

export function CalendarGrid({
  year,
  month,
  noteCounts,
  activeDays,
  selectedDay,
  onSelectDay,
  onChangeMonth,
}: CalendarGridProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <IconButton
          icon="chevron-left"
          size="sm"
          aria-label="Previous month"
          onClick={() => onChangeMonth(-1)}
        />
        <Text variant="h4" as="span" className="text-sm">
          {MONTH_NAMES[month]} {year}
        </Text>
        <IconButton
          icon="chevron-down"
          size="sm"
          aria-label="Next month"
          onClick={() => onChangeMonth(1)}
        />
      </div>

      <div className="grid grid-cols-7 gap-px">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-muted py-1 select-none">
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
              aria-label={`${MONTH_NAMES[month]} ${String(day)}, ${count} notes`}
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
