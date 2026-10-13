import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  compareMonths,
  daysInMonth,
  firstColumn,
  monthLabel,
  monthOf,
  toIso,
  type MonthRef,
} from "@/lib/dates";

export type DayStatus = "open" | "full" | "unknown";

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const fullDate = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/**
 * Month grid with prev/next navigation. Presentational: the parent owns the visible month,
 * the allowed range and the per-day availability.
 */
export function Calendar({
  month,
  today,
  maxDate,
  selected,
  status,
  hint,
  onSelect,
  onMonthChange,
}: {
  month: MonthRef;
  /** first selectable date, YYYY-MM-DD */
  today: string;
  /** last selectable date, YYYY-MM-DD */
  maxDate: string;
  selected: string | null;
  status: (date: string) => DayStatus;
  /** short note for a day, shown as a tooltip and read by screen readers */
  hint?: (date: string) => string | undefined;
  onSelect: (date: string) => void;
  onMonthChange: (delta: -1 | 1) => void;
}) {
  const canGoBack = compareMonths(month, monthOf(today)) > 0;
  const canGoForward = compareMonths(month, monthOf(maxDate)) < 0;
  const offset = firstColumn(month);
  const total = daysInMonth(month);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="type-h4">{monthLabel(month)}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Предыдущий месяц"
            disabled={!canGoBack}
            onClick={() => onMonthChange(-1)}
            className="inline-flex size-10 items-center justify-center rounded-pill border border-line transition hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            disabled={!canGoForward}
            onClick={() => onMonthChange(1)}
            className="inline-flex size-10 items-center justify-center rounded-pill border border-line transition hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekdays.map((name) => (
          <span key={name} className="type-caption py-1.5 text-muted">
            {name}
          </span>
        ))}

        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}

        {Array.from({ length: total }, (_, i) => {
          const date = toIso(month.year, month.month, i + 1);
          const outOfRange = date < today || date > maxDate;
          const state = outOfRange ? "full" : status(date);
          const isSelected = date === selected;
          const [y, m, d] = [month.year, month.month, i + 1];

          return (
            <button
              key={date}
              type="button"
              disabled={outOfRange}
              aria-pressed={isSelected}
              title={outOfRange ? undefined : hint?.(date)}
              aria-label={`${fullDate.format(new Date(Date.UTC(y, m, d)))}${
                !outOfRange && hint?.(date) ? `, ${hint(date)!.toLowerCase()}` : ""
              }`}
              onClick={() => onSelect(date)}
              className={cn(
                "mx-auto flex size-11 items-center justify-center rounded-pill text-base transition lg:size-10",
                isSelected && "bg-accent font-semibold text-on-accent",
                !isSelected && !outOfRange && "hover:bg-surface-2",
                !isSelected && date === today && "border border-fg/40",
                outOfRange && "pointer-events-none text-muted/40",
                !outOfRange && !isSelected && state === "full" && "text-muted line-through",
                !outOfRange && !isSelected && state === "unknown" && "text-fg",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
