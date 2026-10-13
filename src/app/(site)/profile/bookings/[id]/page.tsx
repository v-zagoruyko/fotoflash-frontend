import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookingStatus } from "@/components/booking/booking-status";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Бронь", robots: { index: false, follow: false } };

export default function BookingPage({ params, searchParams }: PageProps<"/profile/bookings/[id]">) {
  return (
    <Container narrow className="py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-surface-2" aria-busy="true" />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Content({
  params,
  searchParams,
}: {
  params: PageProps<"/profile/bookings/[id]">["params"];
  searchParams: PageProps<"/profile/bookings/[id]">["searchParams"];
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  // the id goes into an API path as is
  if (!/^\d+$/.test(id)) notFound();
  return <BookingStatus id={id} payment={typeof payment === "string" ? payment : undefined} />;
}
