import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StepProgress } from "@/components/ui/step-progress";

/** Top of every booking step: where we are and a way back. */
export function BookingHeader({
  step,
  steps = 3,
  title,
  backHref,
  backLabel,
}: {
  step: number;
  steps?: number;
  title: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="type-body-sm -ml-2 inline-flex min-h-touch items-center gap-1.5 rounded-pill px-2 text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel}
        </Link>
        <span className="type-caption text-muted">
          Шаг {step} из {steps}
        </span>
      </div>
      <StepProgress steps={steps} current={step} />
      <h1 className="type-h2">{title}</h1>
    </header>
  );
}
