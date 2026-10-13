"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginPanel } from "@/components/booking/login-panel";
import { BottomBar } from "@/components/ui/bottom-bar";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";
import { clearBookingDraft, clearBookingDraftFor, readBookingDraft, saveBookingDraft } from "@/lib/booking-draft";
import type { components } from "@/lib/api/schema";
import type { ExtraSelection } from "@/lib/booking-params";
import { formatMoney } from "@/lib/format";

type Quote = components["schemas"]["Quote"];
type Booking = components["schemas"]["Booking"];
type QuoteState =
  | { status: "loading" }
  | { status: "ok"; quote: Quote }
  | { status: "error"; message: string };

const QUOTE_DELAY_MS = 250;

type Props = {
  location: string;
  /** hall title, kept in the unfinished-booking hint */
  title: string;
  startsAt: string;
  endsAt: string;
  hours: number;
  extras: ExtraSelection[];
  /** PDF of the personal data consent, for the sign-in checkbox */
  consentUrl?: string;
  /** server-rendered back link, step indicator and title */
  header: ReactNode;
  /** server-rendered hall and time card */
  summary: ReactNode;
};

/** Last step: price breakdown, points, sign-in when needed, and the payment. */
export function CheckoutStep({ location, title, startsAt, endsAt, hours, extras, consentUrl, header, summary }: Props) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [quote, setQuote] = useState<QuoteState>({ status: "loading" });
  /** the last successful price: stays on screen while a new one is being asked for */
  const [last, setLast] = useState<Quote | null>(null);
  /** points the shown price was calculated for, this is what goes to the booking */
  const [bonus, setBonus] = useState(0);
  const [bonusInput, setBonusInput] = useState("");
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);
  const [payError, setPayError] = useState<string | null>(null);
  const bookingId = useRef<number | null>(null);
  const expiresAt = useRef<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abort = useRef<AbortController>(undefined);

  /** Debounced backend price for the given amount of points. State changes only after the delay. */
  function runQuote(points: number, resetInput = false) {
    clearTimeout(timer.current);
    abort.current?.abort();
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      abort.current = controller;
      try {
        const result = await api<Quote>("/bookings/quote/", {
          method: "POST",
          body: {
            location,
            starts_at: startsAt,
            ends_at: endsAt,
            extras: extras.map((item) => ({ extra: item.id, hours: item.hours })),
            bonus_points: points,
          },
          signal: controller.signal,
        });
        setQuote({ status: "ok", quote: result });
        setLast(result);
        setBonus(points);
        if (resetInput) setBonusInput(points > 0 ? String(points) : "");
      } catch (error) {
        if (controller.signal.aborted) return;
        setQuote({
          status: "error",
          message: error instanceof ApiError ? error.message : "Не удалось рассчитать стоимость",
        });
      }
    }, QUOTE_DELAY_MS);
  }

  // A signed-in client gets a points limit in the quote, so the price is asked again whenever
  // the account changes (sign-in here, in the header modal, or sign-out).
  const userId = user?.id ?? null;
  useEffect(() => {
    // an already created booking (came back from the bank, changed the extras) stays in the draft
    const prev = readBookingDraft();
    saveBookingDraft({
      location,
      title,
      startsAt,
      endsAt,
      extras,
      step: prev?.bookingId !== undefined ? prev.step : "checkout",
      bookingId: prev?.bookingId,
      expiresAt: prev?.expiresAt,
    });
    runQuote(0, true);
    return () => {
      clearTimeout(timer.current);
      abort.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // The field takes digits only and is clamped to the backend limit; an empty field means no points.
  function changeBonus(raw: string, max: number) {
    const digits = raw.replace(/\D/g, "");
    const points = Math.min(Number(digits) || 0, max);
    setBonusInput(digits === "" ? "" : String(points));
    setQuote({ status: "loading" });
    runQuote(points);
  }

  // Coming back from the bank page with the back button restores the page from the bfcache as it was.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      payingRef.current = false;
      setPaying(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  /**
   * The unpaid booking of this device holds the slot, so the price of the same time would be refused
   * as "taken". Unchanged: it is returned to be reused. Changed (other extras or points): cancelled.
   */
  async function settleDraftBooking(): Promise<{ reuse: Booking | null; cancelled: boolean }> {
    const draft = readBookingDraft();
    if (draft?.bookingId === undefined) return { reuse: null, cancelled: false };
    try {
      const existing = await api<Booking>(`/bookings/${draft.bookingId}/`);
      if (existing.status !== "pending") return { reuse: null, cancelled: false };
      const wanted = new Map(extras.map((item) => [item.id, item.hours]));
      const same =
        existing.location.slug === location &&
        Date.parse(existing.starts_at) === Date.parse(startsAt) &&
        Date.parse(existing.ends_at) === Date.parse(endsAt) &&
        existing.extras.length === wanted.size &&
        existing.extras.every((line) => wanted.get(line.extra) === (line.hours ?? hours));
      if (same) return { reuse: existing, cancelled: false };
      await api(`/bookings/${existing.id}/cancel/`, { method: "POST" });
      clearBookingDraftFor(existing.id);
      return { reuse: null, cancelled: true };
    } catch {
      // not ours, already gone or the network blinked: carry on as if there was no booking
      return { reuse: null, cancelled: false };
    }
  }

  // Back from the bank or from the extras with a created booking: go on with it, do not create another.
  const settled = useRef(false);
  useEffect(() => {
    if (userId === null || settled.current) return;
    settled.current = true;
    void settleDraftBooking().then(({ reuse, cancelled }) => {
      if (reuse) router.replace(`/profile/bookings/${reuse.id}`);
      else if (cancelled) runQuote(0, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function pay() {
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    setPayError(null);
    try {
      if (bookingId.current === null) {
        const created = await api<Booking>("/bookings/", {
          method: "POST",
          body: {
            location,
            starts_at: startsAt,
            ends_at: endsAt,
            extras: extras.map((item) => ({ extra: item.id, hours: item.hours })),
            bonus_points: bonus,
          },
        });
        bookingId.current = created.id;
        expiresAt.current = created.expires_at ?? undefined;
        // Everything is covered by points: no payment needed.
        if (created.status === "confirmed") {
          clearBookingDraft();
          router.push(`/profile/bookings/${created.id}`);
          return;
        }
      }
      // The booking exists now: the hint switches from "finish" to "pay" and points at the booking.
      saveBookingDraft({
        location,
        title,
        startsAt,
        endsAt,
        extras,
        step: "payment",
        bookingId: bookingId.current,
        expiresAt: expiresAt.current,
      });
      const withLink = await api<Booking>(`/bookings/${bookingId.current}/pay/`, { method: "POST" });
      if (!withLink.payment_url) throw new ApiError(502, "Банк не выдал ссылку на оплату, попробуйте ещё раз");
      window.location.assign(paymentRedirect(withLink.payment_url, bookingId.current));
    } catch (error) {
      if (error instanceof ApiError && error.code === "invalid_booking_state" && bookingId.current !== null) {
        router.push(`/profile/bookings/${bookingId.current}`);
        return;
      }
      // 403 without our own code: the session is gone, show the sign-in form again
      if (error instanceof ApiError && error.status === 403 && !error.code) {
        setUser(null);
        setPayError("Сессия закончилась, войдите ещё раз");
      } else {
        setPayError(error instanceof ApiError ? error.message : "Не удалось перейти к оплате");
      }
      payingRef.current = false;
      setPaying(false);
    }
  }

  const result = quote.status === "ok" ? quote.quote : null;
  const shown = result ?? last;
  const maxBonus = last?.max_bonus_points ?? 0;
  const canPay = user != null && result !== null && !paying;

  const breakdown = (
    <section className="rounded-panel border border-line bg-surface p-4 lg:border-0 lg:bg-transparent lg:p-0">
      <h2 className="type-h4">Состав</h2>
      {shown ? (
        <dl className="type-body-sm mt-3 flex flex-col gap-2.5">
          <Row label={`Зал, ${hours} ч`} value={formatMoney(shown.location_amount)} />
          {shown.extras.map((line) => (
            <Row key={line.extra} label={`${line.title}, ${line.hours} ч`} value={formatMoney(line.amount)} />
          ))}
          <div className="my-1 h-px bg-line" />
          <Row label="Стоимость" value={formatMoney(shown.subtotal)} strong />
          {shown.bonus_points > 0 && (
            <Row label="Оплата баллами" value={`−${formatMoney(String(shown.bonus_points))}`} />
          )}
        </dl>
      ) : (
        <p className="type-body-sm mt-3 text-muted">
          {quote.status === "error" ? quote.message : "Считаем стоимость…"}
        </p>
      )}
    </section>
  );

  const total = result ? formatMoney(result.total) : quote.status === "loading" ? "Считаем…" : "—";
  const statusText = payError ?? (user === null ? "Войдите, чтобы оплатить" : "К оплате");
  const payButton = (
    <Button size="md" disabled={!canPay} onClick={pay}>
      {paying ? "Переходим…" : Number(result?.total) === 0 ? "Подтвердить" : "Оплатить"}
    </Button>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-10">
      <div>
        {header}
        <div className="mt-6 lg:hidden">{summary}</div>

        <div className="mt-3 flex flex-col gap-3 lg:mt-8 lg:max-w-xl">
          <div className="lg:hidden">{breakdown}</div>

          {user && (
            <section className="rounded-panel border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="type-h4">Баллы</h2>
                <span className="type-body-sm text-muted">на счёте {user.bonus_balance}</span>
              </div>
              {maxBonus > 0 ? (
                <>
                  <p className="type-caption mt-1.5 text-muted">
                    1 балл = 1 ₽. В этой брони можно списать до {maxBonus}.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={bonusInput}
                      onChange={(e) => changeBonus(e.target.value, maxBonus)}
                      aria-label="Сколько баллов списать"
                      className="h-12 min-w-0 flex-1 rounded-pill border border-line bg-surface-2 px-5 text-base font-semibold outline-none focus-visible:border-accent"
                    />
                    <Button variant="secondary" size="md" onClick={() => changeBonus(String(maxBonus), maxBonus)}>
                      Максимум
                    </Button>
                  </div>
                </>
              ) : (
                <p className="type-caption mt-1.5 text-muted">
                  {quote.status === "loading" && last === null ? "Считаем…" : "Для этой брони списать баллы нельзя."}
                </p>
              )}
            </section>
          )}

          {user === undefined && <div className="h-44 animate-pulse rounded-panel bg-surface-2" aria-hidden="true" />}
          {user === null && <LoginPanel consentUrl={consentUrl} onLoggedIn={setUser} />}

          {user && (
            <p className="type-caption px-1 text-muted">
              Вы вошли как {user.name || user.email}. После нажатия на оплату время закрепляется за вами на время
              оплаты, если не оплатить вовремя, бронь сбросится.
            </p>
          )}

          <details className="rounded-panel border border-dashed border-line p-4">
            <summary className="type-title">Страница банка не открылась?</summary>
            <p className="type-body-sm mt-2 text-muted">
              Форма оплаты использует сертификат Минцифры, у части устройств он не установлен. Откройте ссылку на
              оплату в Яндекс Браузере или приложении банка, либо{" "}
              <a
                href="https://tbank.ru/bank/help/certificates/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                установите сертификаты
              </a>
              . Ссылку можно скопировать и открыть на другом устройстве.
            </p>
          </details>
        </div>
      </div>

      {/* desktop: sticky order summary with the pay button */}
      <aside className="sticky top-24 hidden flex-col gap-5 rounded-card border border-line bg-surface p-5 lg:flex">
        {summary}
        {breakdown}
        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div aria-live="polite" className={payError ? "type-caption text-danger" : "type-caption text-muted"}>
                {statusText}
              </div>
              <div className="type-price mt-0.5">{total}</div>
            </div>
            {payButton}
          </div>
        </div>
      </aside>

      {/* mobile: bottom bar */}
      <BottomBar outerClassName="mt-6 lg:hidden">
        <div className="min-w-0">
          <div
            aria-live="polite"
            className={payError ? "type-caption truncate text-danger" : "type-caption truncate text-muted"}
          >
            {statusText}
          </div>
          <div className="type-price mt-0.5">{total}</div>
        </div>
        {payButton}
      </BottomBar>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between gap-4 font-semibold" : "flex justify-between gap-4"}>
      <dt>{label}</dt>
      <dd className="shrink-0">{value}</dd>
    </div>
  );
}

/**
 * The fake dev provider lands on our own /dev/pay/ page, which has to know the booking to return to.
 * A real bank link is left untouched.
 */
function paymentRedirect(url: string, bookingId: number | null) {
  const target = new URL(url, window.location.origin);
  if (target.pathname.startsWith("/dev/pay/") && bookingId !== null) {
    target.searchParams.set("booking", String(bookingId));
  }
  return target.toString();
}
