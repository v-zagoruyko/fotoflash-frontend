"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Text clipped to a collapsed height that grows to its real content height inside a `group`
 * (hover/focus). Animating max-height to a guessed value ends early when the text is short,
 * so the real height is measured and exposed as the `--full` CSS variable.
 */
export function ExpandableText({
  children,
  className,
  maxFull,
}: {
  children: ReactNode;
  className?: string;
  /** upper bound for the expanded height, any CSS length */
  maxFull: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => el.style.setProperty("--full", `${el.scrollHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <p
      ref={ref}
      style={{ "--cap": maxFull } as React.CSSProperties}
      className={cn("overflow-hidden", className)}
    >
      {children}
    </p>
  );
}
