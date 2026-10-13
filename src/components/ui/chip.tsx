import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const base = "inline-flex min-h-9 items-center rounded-pill border px-3.5 text-sm";

/** Static label (characteristics, tags). */
export function Chip({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(base, "border-line text-fg", className)} {...props} />;
}

/** Toggle button for filters (category, etc.). */
export function FilterChip({
  selected,
  className,
  type = "button",
  ...props
}: { selected?: boolean } & ComponentProps<"button">) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        base,
        "min-h-10 shrink-0 px-4",
        "transition",
        selected
          ? "border-accent bg-accent font-semibold text-on-accent hover:opacity-90"
          : "border-line text-fg hover:border-fg/40 hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}
