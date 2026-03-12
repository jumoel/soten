import { useCallback, useRef } from "react";
import { IconButton, Text } from "../ds";
import { t } from "../i18n";

export type CalendarGridProps = {
  year: number;
  month: number;
  weekStart: number;
  noteCounts: Map<number, number>;
  activeDays: Set<number> | null;
  selectedRange: [number, number] | null;
  onSelectRange: (range: [number, number] | null) => void;
  onChangeMonth: (delta: number) => void;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "narrow" });

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

function dayFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const btn = el.closest("[data-day]");
  if (!btn) return null;
  return Number((btn as HTMLElement).dataset.day);
}

const R = 6; // border-radius in px, matches Tailwind's rounded-md

export function CalendarGrid({
  year,
  month,
  weekStart,
  noteCounts,
  activeDays,
  selectedRange,
  onSelectRange,
  onChangeMonth,
}: CalendarGridProps) {
  const jsFirstDay = new Date(year, month, 1).getDay();
  const offset = (jsFirstDay - weekStart + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = monthFormatter.format(new Date(year, month));
  const labels = rotatedDayLabels(weekStart);

  const dragStartRef = useRef<number | null>(null);
  const rangeRef = useRef(selectedRange);
  rangeRef.current = selectedRange;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const day = dayFromPoint(e.clientX, e.clientY);
      if (day === null) return;
      const cur = rangeRef.current;
      if (cur && cur[0] === day && cur[1] === day) {
        onSelectRange(null);
        dragStartRef.current = null;
        return;
      }
      dragStartRef.current = day;
      onSelectRange([day, day]);
    },
    [onSelectRange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartRef.current === null) return;
      const day = dayFromPoint(e.clientX, e.clientY);
      if (day === null) return;
      const start = dragStartRef.current;
      onSelectRange([Math.min(start, day), Math.max(start, day)]);
    },
    [onSelectRange],
  );

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);

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

      <div
        className="grid grid-cols-7"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
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
          const [min, max] = selectedRange ?? [0, -1];
          const inRange = day >= min && day <= max;
          const isDimmed = activeDays !== null && !activeDays.has(day);
          const dot = densityClass(count);

          if (!inRange) {
            return (
              <button
                key={day}
                type="button"
                data-day={day}
                className={[
                  "relative flex flex-col items-center justify-center h-8 rounded-md text-xs transition-colors duration-150 select-none",
                  "hover:bg-surface-2 text-paper",
                  isDimmed ? "text-muted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={t("calendar.dayLabel", {
                  month: monthName,
                  day: String(day),
                  count,
                })}
                aria-pressed={false}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    className={[
                      "absolute bottom-0.5 rounded-full",
                      dot,
                      "bg-accent",
                      isDimmed ? "bg-muted" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}
              </button>
            );
          }

          // In-range cell: compute per-corner rounding for connected blob
          const col = i % 7;
          const hasLeft = col > 0 && day - 1 >= min;
          const hasRight = col < 6 && day + 1 <= max;
          const hasAbove = day - 7 >= 1 && day - 7 >= min;
          const hasBelow = day + 7 <= daysInMonth && day + 7 <= max;

          // Convex (outer) corners: round when no neighbor in that direction
          const tl = !hasLeft && !hasAbove ? R : 0;
          const tr = !hasRight && !hasAbove ? R : 0;
          const bl = !hasLeft && !hasBelow ? R : 0;
          const br = !hasRight && !hasBelow ? R : 0;

          // Concave (inside) corners: two adjacent neighbors in range but diagonal is not.
          // Each fill element extends into the empty gap with accent color + border-radius.
          const concaveTL = hasAbove && hasLeft && !(day - 8 >= min && day - 8 <= max);
          const concaveTR = hasAbove && hasRight && !(day - 6 >= min && day - 6 <= max);
          const concaveBL = hasBelow && hasLeft && !(day + 8 >= min && day + 8 <= max);
          const concaveBR = hasBelow && hasRight && !(day + 6 >= min && day + 6 <= max);

          return (
            <button
              key={day}
              type="button"
              data-day={day}
              className="relative flex flex-col items-center justify-center h-8 text-xs transition-colors duration-150 select-none bg-accent text-white dark:text-black"
              style={{ borderRadius: `${tl}px ${tr}px ${br}px ${bl}px` }}
              aria-label={t("calendar.dayLabel", {
                month: monthName,
                day: String(day),
                count,
              })}
              aria-pressed={true}
            >
              <span>{day}</span>
              {count > 0 && (
                <span
                  className={["absolute bottom-0.5 rounded-full bg-white dark:bg-black", dot].join(
                    " ",
                  )}
                />
              )}
              {concaveTL && (
                <span
                  className="absolute"
                  style={{
                    top: -R,
                    left: -R,
                    width: R,
                    height: R,
                    background: `radial-gradient(circle at 0 0, transparent ${R}px, var(--color-accent) ${R}px)`,
                  }}
                />
              )}
              {concaveTR && (
                <span
                  className="absolute"
                  style={{
                    top: -R,
                    right: -R,
                    width: R,
                    height: R,
                    background: `radial-gradient(circle at 100% 0, transparent ${R}px, var(--color-accent) ${R}px)`,
                  }}
                />
              )}
              {concaveBL && (
                <span
                  className="absolute"
                  style={{
                    bottom: -R,
                    left: -R,
                    width: R,
                    height: R,
                    background: `radial-gradient(circle at 0 100%, transparent ${R}px, var(--color-accent) ${R}px)`,
                  }}
                />
              )}
              {concaveBR && (
                <span
                  className="absolute"
                  style={{
                    bottom: -R,
                    right: -R,
                    width: R,
                    height: R,
                    background: `radial-gradient(circle at 100% 100%, transparent ${R}px, var(--color-accent) ${R}px)`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
