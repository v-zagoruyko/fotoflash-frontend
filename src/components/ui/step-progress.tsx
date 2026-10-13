import { cn } from "@/lib/cn";

/** Booking flow progress: `current` is 1-based. */
export function StepProgress({ steps, current }: { steps: number; current: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps}
      aria-valuenow={current}
      aria-label={`Шаг ${current} из ${steps}`}
      className="flex gap-1.5"
    >
      {Array.from({ length: steps }, (_, i) => (
        <div key={i} className={cn("h-1 flex-1 rounded-pill", i < current ? "bg-accent" : "bg-line")} />
      ))}
    </div>
  );
}
