import { cn } from "@/lib/cn";

export type HourCell = {
  /** "14:00" */
  label: string;
  /** "2 100 ₽" */
  price: string;
  available: boolean;
  selected: boolean;
};

/** Grid of hour buttons. Taken hours are shown, but not interactive. */
export function HourGrid({ cells, onSelect }: { cells: HourCell[]; onSelect: (index: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((cell, i) =>
        cell.available ? (
          <button
            key={cell.label}
            type="button"
            aria-pressed={cell.selected}
            onClick={() => onSelect(i)}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-0.5 rounded-panel border transition active:scale-[0.97] lg:h-14",
              cell.selected
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-surface hover:border-fg/40 hover:bg-surface-2",
            )}
          >
            <span className="type-title">{cell.label}</span>
            <span className={cn("type-caption", !cell.selected && "text-muted")}>{cell.price}</span>
          </button>
        ) : (
          <div
            key={cell.label}
            aria-label={`${cell.label}, занято`}
            className="flex h-16 flex-col items-center justify-center gap-0.5 rounded-panel border border-dashed border-line text-muted/60 lg:h-14"
          >
            <span className="type-title line-through">{cell.label}</span>
            <span className="type-caption">занято</span>
          </div>
        ),
      )}
    </div>
  );
}
