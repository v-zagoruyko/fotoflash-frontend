import Image from "next/image";
import Link from "next/link";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });

/** "2026-10-14T14:00:00+05:00" → "ср, 14 октября · 14:00–16:00 · 2 ч". The string already holds studio time. */
export function bookingWhen(startsAt: string, endsAt: string, hours: number) {
  const date = dateFormat.format(new Date(`${startsAt.slice(0, 10)}T12:00:00Z`));
  return `${date} · ${startsAt.slice(11, 16)}–${endsAt.slice(11, 16)} · ${hours} ч`;
}

/** Compact card with the chosen hall and time; the link leads back to change them. */
export function BookingSummary({
  title,
  cover,
  when,
  changeHref,
}: {
  title: string;
  cover: string;
  when: string;
  changeHref: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-panel border border-line bg-surface p-3.5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-field bg-surface-2">
        <Image src={cover} alt="" fill sizes="56px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="type-title truncate">{title}</div>
        <div className="type-caption mt-0.5 text-muted">{when}</div>
      </div>
      <Link
        href={changeHref}
        className="type-body-sm inline-flex min-h-touch items-center px-1 font-semibold text-accent transition-opacity hover:opacity-70"
      >
        Изменить
      </Link>
    </div>
  );
}
