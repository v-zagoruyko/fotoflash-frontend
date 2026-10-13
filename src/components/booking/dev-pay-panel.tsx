"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";

/** Stand-in for the bank page while the backend runs the fake payment provider (DEBUG only). */
export function DevPayPanel({ paymentId, bookingId }: { paymentId: string; bookingId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simulate(status: "CONFIRMED" | "REJECTED" | "CANCELED") {
    setBusy(true);
    setError(null);
    try {
      await api(`/dev/payments/${paymentId}/simulate/`, { method: "POST", body: { status } });
      if (bookingId) {
        const outcome = status === "CONFIRMED" ? "success" : "fail";
        router.push(`/profile/bookings/${bookingId}?payment=${outcome}`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось выполнить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-panel border border-dashed border-line p-5">
      <p className="type-eyebrow text-muted">Только для разработки</p>
      <h1 className="type-h3 mt-2">Фейковая оплата</h1>
      <p className="type-body-sm mt-2 text-muted">
        Платёж {paymentId}
        {bookingId ? `, бронь №${bookingId}` : ", бронь неизвестна: после выбора вернитесь в бронь вручную"}.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <Button disabled={busy} onClick={() => simulate("CONFIRMED")}>
          Оплатить
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => simulate("REJECTED")}>
          Отклонить
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => simulate("CANCELED")}>
          Отменить
        </Button>
      </div>
      {error && <p className="type-body-sm mt-4 text-danger">{error}</p>}
    </div>
  );
}
