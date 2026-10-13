import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Native checkbox, restyled: the box is aligned to the first line of the label, the mark is an icon. */
export function Checkbox({
  children,
  className,
  ...props
}: { children: ReactNode } & Omit<ComponentProps<"input">, "type" | "children">) {
  return (
    <label className={cn("type-body-sm flex min-h-touch cursor-pointer items-start gap-3 py-2.5 text-fg", className)}>
      <span className="relative mt-px flex size-5 shrink-0">
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-md border border-fg/40 bg-surface transition-colors checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          {...props}
        />
        <Check
          className="pointer-events-none absolute inset-0.5 hidden size-4 text-on-accent peer-checked:block"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
      <span className="leading-snug">{children}</span>
    </label>
  );
}
