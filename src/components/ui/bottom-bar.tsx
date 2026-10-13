import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Sticky glass bar with the running total and the main action of a flow step.
 * `above` is an optional panel that sits on top of the bar (e.g. a list of chosen items).
 */
export function BottomBar({
  className,
  outerClassName,
  above,
  ...props
}: ComponentProps<"div"> & { outerClassName?: string; above?: ReactNode }) {
  return (
    <div className={cn("pb-safe pointer-events-none sticky bottom-0 z-30 px-3 pt-3", outerClassName)}>
      <div className="pointer-events-auto mx-auto flex max-w-narrow flex-col gap-2">
        {above}
        <div
          className={cn(
            "glass flex items-center justify-between gap-3 rounded-[2rem] py-2.5 pr-2.5 pl-5",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}
