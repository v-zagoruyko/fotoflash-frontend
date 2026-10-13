import { X } from "lucide-react";
import { formatMoney } from "@/lib/format";

export type SelectedLine = {
  id: number;
  title: string;
  hours: number;
  /** line amount from `quote`, once known */
  amount?: string;
};

/** Compact list of chosen extras with one-tap removal. Used in the desktop aside and the mobile sheet. */
export function SelectedExtras({ lines, onRemove }: { lines: SelectedLine[]; onRemove: (id: number) => void }) {
  if (lines.length === 0) {
    return <p className="type-body-sm text-muted">Пока ничего не выбрано.</p>;
  }
  return (
    <ul className="flex flex-col">
      {lines.map((line) => (
        <li key={line.id} className="flex items-center gap-2 border-b border-line py-2 last:border-b-0">
          <div className="min-w-0 flex-1">
            <div className="type-body-sm truncate">{line.title}</div>
            <div className="type-caption text-muted">
              {line.hours} ч{line.amount ? ` · ${formatMoney(line.amount)}` : ""}
            </div>
          </div>
          <button
            type="button"
            aria-label={`Убрать: ${line.title}`}
            onClick={() => onRemove(line.id)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
