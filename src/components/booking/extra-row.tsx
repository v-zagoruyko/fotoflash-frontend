"use client";

import { ChevronDown, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Extra } from "@/lib/api/catalog";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

const roundButton =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-pill transition-colors disabled:pointer-events-none disabled:opacity-30";

/**
 * One equipment/service card. Not selected: a quiet "+" on the right.
 * Selected: hours stepper, the line amount (from the backend quote) and a one-tap remove.
 */
export function ExtraRow({
  extra,
  hours,
  maxHours,
  amount,
  onAdd,
  onStep,
  onRemove,
}: {
  extra: Extra;
  /** selected hours, 0 when not selected */
  hours: number;
  maxHours: number;
  /** line amount from `quote`, once known */
  amount?: string;
  onAdd: () => void;
  onStep: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = hours > 0;
  const description = extra.description?.replace(/\r/g, "").replace(/\n{2,}/g, "\n").trim();
  const long = (description?.length ?? 0) > 100;

  return (
    <li
      className={cn(
        "rounded-panel border bg-surface p-3.5 transition-colors",
        selected ? "border-fg/30" : "border-line hover:border-fg/20",
      )}
    >
      <div className="flex gap-3.5">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-field bg-surface-2">
          {extra.cover && <Image src={extra.cover} alt="" fill sizes="56px" className="object-cover" />}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="type-title">{extra.title}</h3>
          {description && (
            <>
              <p
                className={cn(
                  "type-caption mt-2 whitespace-pre-line text-muted/90",
                  !open && "line-clamp-2",
                )}
              >
                {description}
              </p>
              {long && (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpen((value) => !value)}
                  className="type-caption mt-0.5 inline-flex min-h-7 items-center gap-1 text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
                >
                  {open ? "Свернуть" : "Подробнее"}
                  <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
                </button>
              )}
            </>
          )}
          <p className="type-title mt-2">
            {formatMoney(extra.hour_price)}{" "}
            <span className="type-caption font-normal text-muted">/ час</span>
          </p>
        </div>

        {!selected && (
          <button
            type="button"
            aria-label={`Добавить: ${extra.title}`}
            onClick={onAdd}
            className={cn(roundButton, "border border-line hover:border-fg hover:bg-fg hover:text-page")}
          >
            <Plus className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {selected && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <div>
            <div className="type-title">{amount ? formatMoney(amount) : "…"}</div>
            <div className="type-caption mt-0.5 text-muted">
              {formatMoney(extra.hour_price)} × {hours} ч
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-pill border border-line">
              <button
                type="button"
                aria-label="Меньше часов"
                disabled={hours <= 1}
                onClick={() => onStep(-1)}
                className={cn(roundButton, "hover:bg-surface-2")}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <span className="type-title min-w-10 text-center">{hours} ч</span>
              <button
                type="button"
                aria-label="Больше часов"
                disabled={hours >= maxHours}
                onClick={() => onStep(1)}
                className={cn(roundButton, "hover:bg-surface-2")}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              aria-label={`Убрать: ${extra.title}`}
              onClick={onRemove}
              className={cn(roundButton, "text-muted hover:bg-danger/10 hover:text-danger")}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
