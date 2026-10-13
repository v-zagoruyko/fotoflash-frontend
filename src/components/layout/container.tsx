import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Page content width with the standard side gutter. `narrow` is the single-column flow width. */
export function Container({ narrow, className, ...props }: { narrow?: boolean } & ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full px-gutter", narrow ? "max-w-narrow" : "max-w-page", className)}
      {...props}
    />
  );
}
