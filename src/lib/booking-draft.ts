"use client";

import { useSyncExternalStore } from "react";
import { bookingQuery, type ExtraSelection } from "@/lib/booking-params";

/**
 * The last unfinished booking, kept in localStorage of this device only (no account involved).
 * It exists to say "you have not finished" in places the UI chooses; nothing personal is stored.
 */
export type BookingDraft = {
  location: string;
  /** hall title, so the hint can be shown without any request */
  title: string;
  startsAt: string;
  endsAt: string;
  extras: ExtraSelection[];
  /** how far the client got */
  step: "extras" | "checkout" | "payment";
  /** set once the booking is created and waits for payment */
  bookingId?: number;
  /** end of the payment hold (ISO), when the booking exists */
  expiresAt?: string;
  /** Date.now() of the last change */
  savedAt: number;
};

const KEY = "fotoflash:booking-draft";
const EVENT = "fotoflash:booking-draft";
const MAX_AGE_MS = 14 * 24 * 3_600_000;

function isDraft(value: unknown): value is BookingDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.location === "string" &&
    typeof d.title === "string" &&
    typeof d.startsAt === "string" &&
    typeof d.endsAt === "string" &&
    Array.isArray(d.extras) &&
    (d.step === "extras" || d.step === "checkout" || d.step === "payment") &&
    typeof d.savedAt === "number"
  );
}

/** A draft is useless once its time has passed, the hold is over, or it is simply old. */
function isStale(draft: BookingDraft) {
  const now = Date.now();
  return (
    Date.parse(draft.endsAt) <= now ||
    now - draft.savedAt > MAX_AGE_MS ||
    (draft.expiresAt !== undefined && Date.parse(draft.expiresAt) <= now)
  );
}

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null; // private mode or blocked storage: the feature just stays off
  }
}

export function readBookingDraft(): BookingDraft | null {
  const store = storage();
  const raw = store?.getItem(KEY);
  if (!store || !raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isDraft(parsed) && !isStale(parsed)) return parsed;
  } catch {}
  store.removeItem(KEY);
  return null;
}

export function saveBookingDraft(draft: Omit<BookingDraft, "savedAt">) {
  try {
    storage()?.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() } satisfies BookingDraft));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

/** Forget the draft only if it is about this very booking (an old booking page must not wipe a new draft). */
export function clearBookingDraftFor(bookingId: number) {
  if (readBookingDraft()?.bookingId === bookingId) clearBookingDraft();
}

export function clearBookingDraft() {
  storage()?.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

/** Where "continue" should lead for this draft. */
export function bookingDraftHref(draft: BookingDraft) {
  if (draft.bookingId !== undefined) return `/profile/bookings/${draft.bookingId}`;
  const query = bookingQuery({
    location: draft.location,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    extras: draft.extras,
  });
  return draft.step === "checkout" ? `/booking/checkout?${query}` : `/booking?${query}`;
}

// useSyncExternalStore needs a stable snapshot: parse again only when the stored string changed.
let lastRaw: string | null | undefined;
let lastValue: BookingDraft | null = null;

function snapshot(): BookingDraft | null {
  const raw = storage()?.getItem(KEY) ?? null;
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastValue = readBookingDraft();
  }
  return lastValue;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The unfinished booking of this device, `null` when there is none (and on the server). */
export function useBookingDraft() {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
