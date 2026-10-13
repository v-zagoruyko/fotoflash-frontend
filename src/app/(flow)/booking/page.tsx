import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingSummary, bookingWhen } from "@/components/booking/booking-summary";
import { ExtrasStep } from "@/components/booking/extras-step";
import { Container } from "@/components/layout/container";
import { getExtras, getLocations } from "@/lib/api/catalog";
import { parseBookingParams } from "@/lib/booking-params";

export const metadata: Metadata = { title: "Оформление брони", robots: { index: false, follow: false } };

export default function BookingPage({ searchParams }: PageProps<"/booking">) {
  // searchParams is request data: stream the content behind a placeholder, keep navigation instant.
  return (
    <Container className="py-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-surface-2" aria-busy="true" />}>
        <ExtrasContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function ExtrasContent({ searchParams }: { searchParams: PageProps<"/booking">["searchParams"] }) {
  const params = parseBookingParams(await searchParams);
  // Opened directly or with a broken link: time is picked on the hall page, so start from the catalog.
  if (!params) redirect("/halls");

  const [halls, extras] = await Promise.all([getLocations(), getExtras()]);
  const hall = halls.find((item) => item.slug === params.location);
  if (!hall) notFound();

  // an extra removed from the catalog since the link was made must not stay selected invisibly
  const known = new Set(extras.map((item) => item.id));
  const initial = Object.fromEntries(
    params.extras.filter((item) => known.has(item.id)).map((item) => [item.id, item.hours]),
  );

  return (
    <ExtrasStep
      location={hall.slug}
      title={hall.title}
      startsAt={params.startsAt}
      endsAt={params.endsAt}
      hours={params.hours}
      extras={extras}
      initial={initial}
      header={
        <BookingHeader
          step={2}
          title="Оборудование и услуги"
          backHref={`/halls/${hall.slug}`}
          backLabel="К выбору времени"
        />
      }
      summary={
        <BookingSummary
          title={hall.title}
          cover={hall.cover}
          when={bookingWhen(params.startsAt, params.endsAt, params.hours)}
          changeHref={`/halls/${hall.slug}`}
        />
      }
    />
  );
}
