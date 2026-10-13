"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { bookingDraftHref, useBookingDraft } from "@/lib/booking-draft";

/**
 * "Booking" button with an indicator: shown only while this device has an unfinished booking,
 * and leads to the step where the client stopped.
 */
export function HeaderBooking() {
  const draft = useBookingDraft();
  if (!draft) return null;

  const paying = draft.bookingId !== undefined;
  const hint = paying ? "Бронь ждёт оплаты" : "Вы не закончили бронь";

  return (
    <Link
      href={bookingDraftHref(draft)}
      aria-label={`${hint}: ${draft.title}`}
      title={`${hint}: ${draft.title}`}
      className="glass relative inline-flex min-h-touch items-center justify-center gap-2 rounded-pill px-3 text-sm font-semibold transition hover:bg-(--glass-hover) sm:px-3.5"
    >
      <CalendarClock className="size-5 shrink-0 sm:size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Бронь</span>
      {/* indicator: a slowly blinking red light, something is waiting to be finished */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 right-1.5 size-2.5 animate-rec rounded-pill bg-rec shadow-[0_0_8px_rgb(255_45_45/0.7)] motion-reduce:animate-none sm:static"
      />
    </Link>
  );
}
