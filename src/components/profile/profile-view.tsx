"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

type User = components["schemas"]["User"];
type Bonus = components["schemas"]["Bonus"];
type BookingPage = components["schemas"]["PaginatedBookingList"];
type Booking = components["schemas"]["Booking"];

const whenFormat = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Yekaterinburg",
});

/** "2026-10-14T14:00:00+05:00" → "ср, 14 октября · 14:00–16:00" (the string already holds studio time) */
const bookingWhen = (b: Booking) =>
  `${whenFormat.format(new Date(`${b.starts_at.slice(0, 10)}T12:00:00Z`))} · ${b.starts_at.slice(11, 16)}–${b.ends_at.slice(11, 16)}`;

const statusStyle: Record<string, string> = {
  pending: "bg-surface-2 text-fg",
  confirmed: "bg-success/15 text-success",
  completed: "bg-surface-2 text-muted",
  cancelled: "bg-surface-2 text-muted",
  expired: "bg-surface-2 text-muted",
};

/** Account page: profile, points and bookings. Everything here needs a session. */
export function ProfileView() {
  const { user, setUser, openLogin, logout } = useAuth();

  if (user === undefined) {
    return <div className="h-64 animate-pulse rounded-card bg-surface-2" aria-busy="true" />;
  }

  if (user === null) {
    return (
      <div className="flex max-w-md flex-col items-start gap-4">
        <h1 className="type-h2">Личный кабинет</h1>
        <p className="type-body text-muted">Войдите, чтобы увидеть свои брони и баллы.</p>
        <Button onClick={() => openLogin()}>Войти</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-eyebrow text-muted">Личный кабинет</p>
          <h1 className="type-h1 mt-2.5">{user.name?.trim() || user.email}</h1>
          {user.name?.trim() && <p className="type-body mt-2 text-muted">{user.email}</p>}
        </div>
        <Button variant="secondary" size="md" onClick={() => void logout().catch(() => {})}>
          <LogOut className="size-4" aria-hidden="true" />
          Выйти
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-10">
        <Bookings />
        <div className="flex flex-col gap-6">
          <ProfileForm user={user} onSaved={setUser} />
          <Points balance={user.bonus_balance} />
        </div>
      </div>
    </div>
  );
}

function Bookings() {
  const [items, setItems] = useState<Booking[] | null>(null);
  const [next, setNext] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<BookingPage>("/bookings/")
      .then((data) => {
        if (cancelled) return;
        setItems(data.results);
        setNext(data.next ? 2 : null);
      })
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "Не удалось загрузить брони"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function more() {
    if (next === null) return;
    setLoadingMore(true);
    try {
      const data = await api<BookingPage>(`/bookings/?page=${next}`);
      setItems((prev) => [...(prev ?? []), ...data.results]);
      setNext(data.next ? next + 1 : null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить брони");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section>
      <h2 className="type-h3">Мои брони</h2>
      {error && <p className="type-body-sm mt-3 text-danger">{error}</p>}
      {items === null && !error && <div className="mt-4 h-40 animate-pulse rounded-card bg-surface-2" />}
      {items && items.length === 0 && (
        <p className="type-body mt-4 text-muted">
          Броней пока нет. <Link href="/halls" className="text-accent underline">Выбрать зал</Link>
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {items.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/profile/bookings/${booking.id}`}
                className="flex items-center justify-between gap-4 rounded-panel border border-line bg-surface p-4 transition-colors hover:border-fg/30"
              >
                <div className="min-w-0">
                  <div className="type-title truncate">{booking.location.title}</div>
                  <div className="type-caption mt-0.5 text-muted">{bookingWhen(booking)}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="type-title">{formatMoney(booking.total)}</span>
                  <span
                    className={cn(
                      "type-caption rounded-pill px-2.5 py-0.5 font-semibold",
                      statusStyle[booking.status ?? "pending"],
                    )}
                  >
                    {booking.status_display}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {next !== null && (
        <Button variant="secondary" size="md" className="mt-4" disabled={loadingMore} onClick={more}>
          Показать ещё
        </Button>
      )}
    </section>
  );
}

function ProfileForm({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const changed = name.trim() !== (user.name ?? "") || phone.trim() !== (user.phone ?? "");

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const updated = await api<User>("/me/", { method: "PATCH", body: { name: name.trim(), phone: phone.trim() } });
      onSaved(updated);
      setMessage({ text: "Сохранено" });
    } catch (e) {
      const fields = e instanceof ApiError ? e.fields : undefined;
      const text = fields ? Object.values(fields)[0]?.[0] : e instanceof ApiError ? e.message : undefined;
      setMessage({ text: text ?? "Не удалось сохранить", error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="type-h4">Профиль</h2>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label="Имя" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field
          label="Телефон"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+79991234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="md" disabled={busy || !changed}>
            Сохранить
          </Button>
          {message && (
            <span className={cn("type-body-sm", message.error ? "text-danger" : "text-muted")}>{message.text}</span>
          )}
        </div>
      </form>
    </Card>
  );
}

function Points({ balance }: { balance: number }) {
  const [data, setData] = useState<Bonus | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Bonus>("/me/bonus/")
      .then((result) => !cancelled && setData(result))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-h4">Баллы</h2>
        <span className="type-price">{data?.balance ?? balance}</span>
      </div>
      <p className="type-caption mt-1 text-muted">1 балл = 1 ₽. Начисляются кешбэком после оплаты.</p>
      {data && data.transactions.length > 0 && (
        <ul className="mt-4 flex flex-col">
          {data.transactions.slice(0, 8).map((tx) => (
            <li key={tx.id} className="flex items-center justify-between gap-3 border-t border-line py-2.5">
              <div className="min-w-0">
                <div className="type-body-sm truncate">{tx.comment || tx.kind_display}</div>
                <div className="type-caption text-muted">{dayFormat.format(new Date(tx.created_at))}</div>
              </div>
              <span className={cn("type-title shrink-0", tx.points > 0 ? "text-success" : "text-fg")}>
                {tx.points > 0 ? "+" : ""}
                {tx.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
