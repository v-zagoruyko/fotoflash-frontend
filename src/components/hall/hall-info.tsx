import { FileText } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import type { Location } from "@/lib/api/catalog";
import { formatMoney, formatTime } from "@/lib/format";
import { formatCount } from "@/lib/plural";

const isPositive = (amount?: string) => Number(amount) > 0;

/** Title, tariff lines, facts and description of a hall. Only shows what the API gives, no price math. */
export function HallInfo({ hall }: { hall: Location }) {
  const { late_from, late_surcharge, weekend_surcharge, open_time, close_time, min_hours = 1 } = hall;
  const description = hall.description?.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();

  const tariffs = [
    late_from && isPositive(late_surcharge) && `С ${formatTime(late_from)} доплата ${formatMoney(late_surcharge!)} в час`,
    isPositive(weekend_surcharge) && `В выходные доплата ${formatMoney(weekend_surcharge!)} в час`,
  ].filter(Boolean);

  return (
    <div className="relative -mt-6 rounded-t-card bg-page px-gutter pt-7 lg:mt-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:pt-8">
      <h1 className="type-h1 lg:text-4xl">{hall.title}</h1>
      <p className="type-body mt-3 text-muted">{formatMoney(hall.hour_price)} в час</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {open_time && close_time && (
          <Chip>
            {formatTime(open_time)}–{formatTime(close_time)}
          </Chip>
        )}
        <Chip>от {formatCount(min_hours, ["часа", "часов", "часов"])}</Chip>
      </div>

      {tariffs.length > 0 && (
        <ul className="type-body-sm mt-4 flex flex-col gap-1 text-muted">
          {tariffs.map((line) => (
            <li key={String(line)}>{line}</li>
          ))}
        </ul>
      )}

      {description && <p className="type-body mt-6 max-w-2xl whitespace-pre-line text-fg/90">{description}</p>}

      {hall.rules_document && (
        <a
          href={hall.rules_document.url}
          target="_blank"
          rel="noopener noreferrer"
          className="type-body-sm mt-6 inline-flex min-h-touch items-center gap-2 text-muted transition-colors hover:text-fg"
        >
          <FileText className="size-4" aria-hidden="true" />
          {hall.rules_document.title} (PDF)
        </a>
      )}
    </div>
  );
}
