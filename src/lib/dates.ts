/**
 * Calendar-date helpers on "YYYY-MM-DD" strings. A date here is a day on the calendar, not an instant,
 * so everything goes through UTC to stay independent of the browser's timezone.
 */
export type MonthRef = { year: number; month: number }; // month is 0-11

const pad = (n: number) => String(n).padStart(2, "0");

export function toIso(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function parseIso(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function addDays(date: string, days: number) {
  const { year, month, day } = parseIso(date);
  const d = new Date(Date.UTC(year, month, day + days));
  return toIso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Whole days from `a` to `b` (negative when b is earlier). */
export function diffDays(a: string, b: string) {
  const x = parseIso(a);
  const y = parseIso(b);
  return Math.round((Date.UTC(y.year, y.month, y.day) - Date.UTC(x.year, x.month, x.day)) / 86_400_000);
}

export const daysInMonth = ({ year, month }: MonthRef) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** Monday-first column (0-6) of the 1st of the month. */
export const firstColumn = ({ year, month }: MonthRef) => (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

export const monthOf = (date: string): MonthRef => {
  const { year, month } = parseIso(date);
  return { year, month };
};

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const index = year * 12 + month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

/** Negative / zero / positive like a comparator. */
export const compareMonths = (a: MonthRef, b: MonthRef) => a.year * 12 + a.month - (b.year * 12 + b.month);

const monthFormat = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" });

/** "Октябрь 2026" */
export function monthLabel({ year, month }: MonthRef) {
  const text = monthFormat.format(new Date(Date.UTC(year, month, 1))).replace(/\s?г\.$/, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
