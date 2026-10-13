import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  className,
}: {
  eyebrow: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <p className="type-eyebrow text-muted">{eyebrow}</p>
      <h2 className="type-h2">{title}</h2>
    </div>
  );
}
