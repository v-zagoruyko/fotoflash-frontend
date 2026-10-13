/**
 * The booking flow keeps its state in the URL: refresh, back button and sharing all just work.
 * `/booking?location=studiya-c&starts_at=…&ends_at=…&extras=12:2,20:1` (extras are `id:hours`).
 */
export type ExtraSelection = { id: number; hours: number };

export type BookingParams = {
  location: string;
  startsAt: string;
  endsAt: string;
  /** whole hours between start and end */
  hours: number;
  extras: ExtraSelection[];
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseBookingParams(raw: RawParams): BookingParams | null {
  const location = first(raw.location);
  const startsAt = first(raw.starts_at);
  const endsAt = first(raw.ends_at);
  if (!location || !startsAt || !endsAt) return null;

  const span = Date.parse(endsAt) - Date.parse(startsAt);
  const hours = Math.round(span / 3_600_000);
  if (!Number.isFinite(span) || hours < 1) return null;

  const extras = (first(raw.extras) ?? "")
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [id, h] = part.split(":").map(Number);
      return { id, hours: Math.min(Math.max(h || hours, 1), hours) };
    })
    .filter((item) => Number.isInteger(item.id) && item.id > 0)
    // the same extra twice would reach the backend as two lines
    .filter((item, i, all) => all.findIndex((other) => other.id === item.id) === i);

  return { location, startsAt, endsAt, hours, extras };
}

export function bookingQuery({ location, startsAt, endsAt, extras }: Omit<BookingParams, "hours">) {
  const query = new URLSearchParams({ location, starts_at: startsAt, ends_at: endsAt });
  if (extras.length > 0) query.set("extras", extras.map((e) => `${e.id}:${e.hours}`).join(","));
  return query.toString();
}
