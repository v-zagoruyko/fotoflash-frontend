import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingSummary, bookingWhen } from "@/components/booking/booking-summary";
import { CheckoutStep } from "@/components/booking/checkout-step";
import { Container } from "@/components/layout/container";
import { getDocuments, getExtras, getLocations } from "@/lib/api/catalog";
import { bookingQuery, parseBookingParams } from "@/lib/booking-params";
import { DOCUMENT_SLUGS } from "@/lib/documents";

export const metadata: Metadata = { title: "Оплата брони", robots: { index: false, follow: false } };

export default function CheckoutPage({ searchParams }: PageProps<"/booking/checkout">) {
  return (
    <Container className="py-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-surface-2" aria-busy="true" />}>
        <CheckoutContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function CheckoutContent({ searchParams }: { searchParams: PageProps<"/booking/checkout">["searchParams"] }) {
  const params = parseBookingParams(await searchParams);
  if (!params) redirect("/halls");

  const [halls, documents, catalog] = await Promise.all([getLocations(), getDocuments(), getExtras()]);
  const hall = halls.find((item) => item.slug === params.location);
  if (!hall) notFound();

  const known = new Set(catalog.map((item) => item.id));
  const extras = params.extras.filter((item) => known.has(item.id));
  const consent = documents.find((doc) => doc.slug === DOCUMENT_SLUGS.consent);

  return (
    <CheckoutStep
      location={hall.slug}
      title={hall.title}
      startsAt={params.startsAt}
      endsAt={params.endsAt}
      hours={params.hours}
      extras={extras}
      consentUrl={consent?.url}
      header={
        <BookingHeader
          step={3}
          title="Проверьте и оплатите"
          backHref={`/booking?${bookingQuery({ ...params, extras })}`}
          backLabel="К допам"
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
