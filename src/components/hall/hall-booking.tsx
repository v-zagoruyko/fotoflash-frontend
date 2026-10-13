"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Calendar, type DayStatus } from "@/components/hall/calendar";
import { HourGrid } from "@/components/hall/hour-grid";
import { BottomBar } from "@/components/ui/bottom-bar";
import { Button, ButtonLink } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { formatMoney } from "@/lib/format";
import { addDays, diffDays, monthOf, shiftMonth, type MonthRef } from "@/lib/dates";
import { saveBookingDraft } from "@/lib/booking-draft";
import { formatCount } from "@/lib/plural";

type Day = components["schemas"]["DayAvailability"];
/** `availability?summary=1`: one light row per day instead of the full list of slots */
type DaySummary = { date: string; free_hours: number };
type Quote = components["schemas"]["Quote"];

type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; total: string }
  | { status: "error"; message: string };

const MAX_SUMMARY_DAYS = 93; // the summary mode returns up to 93 days in one request
const STUDIO_TIMEZONE = "Asia/Yekaterinburg";
const QUOTE_DELAY_MS = 250;

/** Calendar date "today" in the studio's timezone, as YYYY-MM-DD. */
function studioToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: STUDIO_TIMEZONE }).format(new Date());
}

const subscribeNever = () => () => {};

/** "2026-10-14T09:00:00+05:00" → "09:00". The API always answers in studio time. */
const clock = (iso: string) => iso.slice(11, 16);

const longDate = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const asUtcNoon = (date: string) => new Date(`${date}T12:00:00Z`);

type Props = {
  slug: string;
  /** hall title, kept in the unfinished-booking hint */
  title: string;
  minHours: number;
  /** how many days ahead a booking can start; the calendar ends there */
  horizonDays: number;
  /** server-rendered gallery and hall description, placed in the left column */
  gallery: ReactNode;
  info: ReactNode;
};

/**
 * Hall page body: left column (gallery + info), right column with the date/hour picker.
 * Prices come from the API: per-hour `price` from availability and the total from `quote`.
 */
export function HallBooking({ slug, title, minHours, horizonDays, gallery, info }: Props) {
  // "Today" depends on the clock: null on the server and during hydration, the studio date afterwards.
  const today = useSyncExternalStore(subscribeNever, studioToday, () => null);
  const [shownMonth, setShownMonth] = useState<MonthRef | null>(null);
  const month = shownMonth ?? (today ? monthOf(today) : null);
  // free hours per day for the whole horizon (null until loaded) and the slots of days opened so far
  const [free, setFree] = useState<Record<string, number> | null>(null);
  const [byDate, setByDate] = useState<Record<string, Day>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);
  const [quote, setQuote] = useState<QuoteState>({ status: "idle" });

  const quoteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const quoteAbort = useRef<AbortController>(undefined);
  const loadedDays = useRef(new Set<string>());

  const maxDate = today ? addDays(today, horizonDays) : null;

  // 1. Which days have free hours: one light request for the whole booking horizon.
  useEffect(() => {
    if (!today || !maxDate) return;
    const days = Math.min(diffDays(today, maxDate) + 1, MAX_SUMMARY_DAYS);
    api<DaySummary[]>(`/locations/${slug}/availability/?date=${today}&days=${days}&summary=1`)
      .then((list) => {
        setFree(Object.fromEntries(list.map((item) => [item.date, item.free_hours])));
        setLoadError(null);
        // First load: land on the nearest day that has a free hour.
        const firstOpen = list.find((item) => item.free_hours > 0);
        setSelectedDate((current) => current ?? firstOpen?.date ?? null);
      })
      .catch((error) => {
        setLoadError(error instanceof ApiError ? error.message : "Не удалось загрузить свободное время");
      });
  }, [slug, today, maxDate, attempt]);

  // 2. The hours of the selected day, loaded when the day is opened.
  useEffect(() => {
    if (!selectedDate || loadedDays.current.has(selectedDate)) return;
    const date = selectedDate;
    loadedDays.current.add(date);
    api<Day[]>(`/locations/${slug}/availability/?date=${date}&days=1`)
      .then(([data]) => {
        if (data) setByDate((prev) => ({ ...prev, [data.date]: data }));
      })
      .catch((error) => {
        loadedDays.current.delete(date);
        setLoadError(error instanceof ApiError ? error.message : "Не удалось загрузить время");
      });
  }, [slug, selectedDate, attempt]);

  useEffect(
    () => () => {
      clearTimeout(quoteTimer.current);
      quoteAbort.current?.abort();
    },
    [],
  );

  const day = selectedDate ? byDate[selectedDate] : undefined;
  const slots = day?.slots ?? [];

  const dayStatus = (date: string): DayStatus => {
    const hours = free?.[date];
    if (hours === undefined) return "unknown";
    return hours > 0 ? "open" : "full";
  };

  const dayHint = (date: string) => {
    const hours = free?.[date];
    if (hours === undefined) return undefined;
    return hours > 0 ? `Свободно: ${formatCount(hours, ["час", "часа", "часов"])}` : "Занято";
  };

  function requestQuote(from: number, to: number) {
    clearTimeout(quoteTimer.current);
    quoteAbort.current?.abort();

    if (to - from + 1 < minHours) {
      setQuote({ status: "idle" });
      return;
    }
    setQuote({ status: "loading" });
    quoteTimer.current = setTimeout(async () => {
      const controller = new AbortController();
      quoteAbort.current = controller;
      try {
        const result = await api<Quote>("/bookings/quote/", {
          method: "POST",
          body: { location: slug, starts_at: slots[from].starts_at, ends_at: slots[to].ends_at },
          signal: controller.signal,
        });
        setQuote({ status: "ok", total: result.total });
      } catch (error) {
        if (controller.signal.aborted) return;
        setQuote({
          status: "error",
          message: error instanceof ApiError ? error.message : "Не удалось рассчитать стоимость",
        });
      }
    }, QUOTE_DELAY_MS);
  }

  function selectDay(date: string) {
    clearTimeout(quoteTimer.current);
    quoteAbort.current?.abort();
    setSelectedDate(date);
    setRange(null);
    setQuote({ status: "idle" });
  }

  function changeMonth(delta: -1 | 1) {
    if (month) setShownMonth(shiftMonth(month, delta));
  }

  /** One tap picks an hour; tapping another free hour extends the range if everything between is free. */
  function selectHour(index: number) {
    let next = { from: index, to: index };
    if (range && range.from === range.to && range.from !== index) {
      const from = Math.min(range.from, index);
      const to = Math.max(range.from, index);
      if (slots.slice(from, to + 1).every((slot) => slot.is_available)) next = { from, to };
    }
    setRange(next);
    requestQuote(next.from, next.to);
  }

  const hours = range ? range.to - range.from + 1 : 0;
  const belowMinimum = range !== null && hours < minHours;
  const bookingHref =
    range && quote.status === "ok"
      ? `/booking?${new URLSearchParams({
          location: slug,
          starts_at: slots[range.from].starts_at,
          ends_at: slots[range.to].ends_at,
        })}`
      : null;

  // A chosen and priced time is already an unfinished booking: remember it on this device.
  const draftStart = range && bookingHref ? slots[range.from].starts_at : null;
  const draftEnd = range && bookingHref ? slots[range.to].ends_at : null;
  useEffect(() => {
    if (draftStart && draftEnd) {
      saveBookingDraft({ location: slug, title, startsAt: draftStart, endsAt: draftEnd, extras: [], step: "extras" });
    }
  }, [slug, title, draftStart, draftEnd]);

  const summaryLabel = range
    ? `${clock(slots[range.from].starts_at)}–${clock(slots[range.to].ends_at)} · ${hours} ч`
    : "Время не выбрано";
  const summaryPrice =
    quote.status === "ok" ? formatMoney(quote.total) : quote.status === "loading" ? "Считаем…" : "—";
  const hint = belowMinimum
    ? `Минимум ${formatCount(minHours, ["час", "часа", "часов"])}, выберите ещё`
    : quote.status === "error"
      ? quote.message
      : null;

  const action = bookingHref ? (
    <ButtonLink href={bookingHref} size="md">
      Далее
    </ButtonLink>
  ) : (
    <Button size="md" disabled>
      Далее
    </Button>
  );

  return (
    <div className="lg:mx-auto lg:max-w-page lg:px-gutter lg:pt-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-10">
        <div>
          {gallery}
          {info}
        </div>

        <aside className="px-gutter pt-8 pb-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:rounded-card lg:border lg:border-line lg:bg-surface lg:p-5">
          {!month && !loadError && <p className="type-body-sm text-muted">Загружаем свободное время…</p>}

          {loadError && (
            <div className="mb-4 flex flex-col items-start gap-3">
              <p className="type-body-sm text-danger">{loadError}</p>
              <Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
                Повторить
              </Button>
            </div>
          )}

          {month && today && maxDate && (
            <div className="flex flex-col gap-6">
              <section>
                <h2 className="type-h4 mb-3">Дата</h2>
                <Calendar
                  month={month}
                  today={today}
                  maxDate={maxDate}
                  selected={selectedDate}
                  status={dayStatus}
                  hint={dayHint}
                  onSelect={selectDay}
                  onMonthChange={changeMonth}
                />
              </section>

              <section>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="type-h4">Время</h2>
                  {selectedDate && (
                    <span className="type-body-sm text-muted">{longDate.format(asUtcNoon(selectedDate))}</span>
                  )}
                </div>
                {!selectedDate ? (
                  <p className="type-body-sm text-muted">Выберите дату в календаре.</p>
                ) : !day ? (
                  <p className="type-body-sm text-muted">Загружаем время…</p>
                ) : slots.length === 0 ? (
                  <p className="type-body-sm text-muted">На этот день время недоступно.</p>
                ) : (
                  <HourGrid
                    cells={slots.map((slot, i) => ({
                      label: clock(slot.starts_at),
                      price: formatMoney(slot.price),
                      available: slot.is_available,
                      selected: range !== null && i >= range.from && i <= range.to,
                    }))}
                    onSelect={selectHour}
                  />
                )}
                <p className="type-caption mt-3 text-muted">
                  Нажмите на час. Чтобы взять несколько подряд, нажмите ещё на последний нужный.
                </p>
              </section>

              {/* inline summary on desktop, the mobile one is the sticky bar below */}
              <div className="hidden flex-col gap-3 border-t border-line pt-5 lg:flex">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="type-caption text-muted">{summaryLabel}</div>
                    <div className="type-price mt-0.5">{summaryPrice}</div>
                  </div>
                  {action}
                </div>
                {hint && (
                  <p className={quote.status === "error" ? "type-caption text-danger" : "type-caption text-muted"}>
                    {hint}
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <BottomBar outerClassName="mt-4 lg:hidden">
        <div className="min-w-0">
          <div className="type-caption truncate text-muted">{hint ?? summaryLabel}</div>
          <div className="type-price mt-0.5">{summaryPrice}</div>
        </div>
        {action}
      </BottomBar>
    </div>
  );
}
