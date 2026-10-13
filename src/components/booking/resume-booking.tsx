"use client";

import { X } from "lucide-react";
import { bookingWhen } from "@/components/booking/booking-summary";
import { ButtonLink } from "@/components/ui/button";
import { bookingDraftHref, clearBookingDraft, useBookingDraft, type BookingDraft } from "@/lib/booking-draft";

/** "You have not finished" hint for the unfinished booking of this device. Renders nothing when there is none. */
export function ResumeBooking({ className }: { className?: string }) {
  const draft = useBookingDraft();
  if (!draft) return null;
  return <ResumeBookingCard draft={draft} className={className} />;
}

/** The card itself; separate so it can be shown with any data (catalog, tests). */
export function ResumeBookingCard({ draft, className }: { draft: BookingDraft; className?: string }) {
  const hours = Math.round((Date.parse(draft.endsAt) - Date.parse(draft.startsAt)) / 3_600_000);
  const paying = draft.bookingId !== undefined;

  return (
    <div
      role="status"
      className={`glass flex items-center gap-3 rounded-panel py-2.5 pr-2 pl-4 ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="type-caption text-muted">{paying ? "Бронь ждёт оплаты" : "Вы не закончили бронь"}</p>
        <p className="type-body-sm truncate font-semibold">
          {draft.title} · {bookingWhen(draft.startsAt, draft.endsAt, hours)}
        </p>
      </div>
      <ButtonLink href={bookingDraftHref(draft)} size="sm" variant="primary">
        {paying ? "Оплатить" : "Продолжить"}
      </ButtonLink>
      <button
        type="button"
        aria-label="Скрыть"
        onClick={clearBookingDraft}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill text-muted transition-colors hover:bg-fg/10 hover:text-fg"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

