"use client";

import { Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError, api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { bookingWhen } from "@/components/booking/booking-summary";
import { clearBookingDraftFor } from "@/lib/booking-draft";
import { formatMoney } from "@/lib/format";

type Booking = components["schemas"]["Booking"];

const POLL_MS = 2000;
const POLL_LIMIT_MS = 30_000;

const timeLeft = (ms: number) => {
  const total = Math.max(Math.floor(ms / 1000), 0);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * A booking after checkout or after the return from the bank.
 * `?payment=success` proves nothing: the status is polled until it becomes `confirmed`.
 */
export function BookingStatus({ id, payment }: { id: string; payment?: string }) {
  const { user, openLogin } = useAuth();
  const userId = user?.id ?? null;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [givenUp, setGivenUp] = useState(false);
  const startedAt = useRef<number | null>(null);
  const refetched = useRef(false);

  // Load, and while a returned payment is not yet confirmed, poll for up to 30 seconds.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const load = async () => {
      try {
        const data = await api<Booking>(`/bookings/${id}/`);
        if (cancelled) return;
        setBooking(data);
        setError(null);
        setNeedsLogin(false);
        // paid, cancelled or expired: nothing left to finish
        if (data.status !== "pending") clearBookingDraftFor(data.id);
        startedAt.current ??= Date.now();
        const waiting = payment === "success" && data.status === "pending";
        if (waiting && Date.now() - startedAt.current < POLL_LIMIT_MS) {
          timer = setTimeout(load, POLL_MS);
        } else if (waiting) {
          setGivenUp(true);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
          setNeedsLogin(true);
          return;
        }
        // a blip in the network must not stop the wait for the bank's confirmation
        if (payment === "success" && Date.now() - (startedAt.current ?? Date.now()) < POLL_LIMIT_MS) {
          startedAt.current ??= Date.now();
          timer = setTimeout(load, POLL_MS);
        } else {
          setError(e instanceof ApiError ? e.message : "Не удалось загрузить бронь");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, payment, userId]);

  // The hold is over: ask once, the backend has turned the booking into "expired" by now.
  useEffect(() => {
    if (left === null || left > 0 || refetched.current) return;
    refetched.current = true;
    api<Booking>(`/bookings/${id}/`).then(setBooking, () => {});
  }, [left, id]);

  // Hold countdown for a pending booking.
  useEffect(() => {
    if (booking?.status !== "pending" || !booking.expires_at) return;
    const expires = Date.parse(booking.expires_at);
    const tick = () => setLeft(expires - Date.now());
    const interval = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(interval);
      clearTimeout(first);
    };
  }, [booking?.status, booking?.expires_at]);

  async function cancel() {
    if (!window.confirm("Отменить бронь?")) return;
    setBusy(true);
    try {
      const cancelled = await api<Booking>(`/bookings/${id}/cancel/`, { method: "POST" });
      setBooking(cancelled);
      clearBookingDraftFor(cancelled.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось отменить");
    } finally {
      setBusy(false);
    }
  }

  async function payAgain() {
    setBusy(true);
    setError(null);
    try {
      const withLink = await api<Booking>(`/bookings/${id}/pay/`, { method: "POST" });
      if (withLink.payment_url) {
        const target = new URL(withLink.payment_url, window.location.origin);
        if (target.pathname.startsWith("/dev/pay/")) target.searchParams.set("booking", id);
        window.location.assign(target.toString());
        return;
      }
      throw new ApiError(502, "Банк не выдал ссылку на оплату, попробуйте ещё раз");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось получить ссылку на оплату");
      setBusy(false);
    }
  }

  if (needsLogin && !booking) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="type-h2">Бронь №{id}</h1>
        <p className="type-body text-muted">
          Чтобы посмотреть бронь, войдите в аккаунт, с которого она оформлена.
        </p>
        <Button onClick={() => openLogin()}>Войти</Button>
      </div>
    );
  }
  if (error && !booking) {
    return <p className="type-body text-danger">{error}</p>;
  }
  if (!booking) return <div className="h-64 animate-pulse rounded-card bg-surface-2" aria-busy="true" />;

  const hours = Math.round((Date.parse(booking.ends_at) - Date.parse(booking.starts_at)) / 3_600_000);
  const pending = booking.status === "pending";
  const confirmed = booking.status === "confirmed" || booking.status === "completed";
  const waiting = payment === "success" && pending && !givenUp;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="type-eyebrow text-muted">Бронь №{booking.id}</p>
        <h1 aria-live="polite" className="type-h2 mt-2">
          {waiting ? "Проверяем оплату…" : confirmed ? "Бронь подтверждена" : booking.status_display}
        </h1>
        {payment === "fail" && pending && (
          <p className="type-body-sm mt-2 text-danger">Оплата не прошла. Можно попробовать ещё раз.</p>
        )}
        {payment === "success" && pending && givenUp && (
          <p className="type-body-sm mt-2 text-muted">
            Банк ещё не подтвердил оплату. Обычно это занимает до минуты, обновите страницу чуть позже.
          </p>
        )}
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <div className="type-title">{booking.location.title}</div>
        <div className="type-body-sm text-muted">{bookingWhen(booking.starts_at, booking.ends_at, hours)}</div>
        {booking.extras.length > 0 && (
          <ul className="type-body-sm flex flex-col gap-1 border-t border-line pt-3">
            {booking.extras.map((extra, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{extra.title}</span>
                <span className="text-muted">{extra.hours} ч</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="type-body-sm text-muted">
            {booking.bonus_spent ? `Списано баллов: ${booking.bonus_spent}` : "К оплате"}
          </span>
          <span className="type-price">{formatMoney(booking.total)}</span>
        </div>
      </Card>

      {pending && (
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="type-body-sm text-muted">Время удерживается</span>
            <span className="type-price tabular-nums">{left === null ? "…" : timeLeft(left)}</span>
          </div>
          <Button onClick={payAgain} disabled={busy} block>
            Оплатить
          </Button>
          {booking.payment_url && (
            <button
              type="button"
              className="type-body-sm inline-flex min-h-touch items-center justify-center gap-2 text-muted transition-colors hover:text-fg"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(booking.payment_url ?? "");
                  setCopied(true);
                } catch {
                  setError("Не удалось скопировать, выделите и скопируйте ссылку вручную");
                }
              }}
            >
              <Copy className="size-4" aria-hidden="true" />
              {copied ? "Ссылка скопирована" : "Скопировать ссылку на оплату"}
            </button>
          )}
          <p className="type-caption text-muted">
            Если страница банка не открывается (сертификат Минцифры), откройте ссылку в Яндекс Браузере, приложении
            банка или на другом устройстве.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {booking.can_cancel && (
          <Button variant="secondary" disabled={busy} onClick={cancel} block>
            Отменить бронь
          </Button>
        )}
        <ButtonLink href="/halls" variant="ghost" block>
          К залам
        </ButtonLink>
      </div>
      {error && (
        <p role="alert" className="type-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
