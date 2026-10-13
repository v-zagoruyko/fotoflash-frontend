import { Suspense } from "react";
import { DevPayPanel } from "@/components/booking/dev-pay-panel";
import { Container } from "@/components/layout/container";

export default function DevPayPage({ params, searchParams }: PageProps<"/dev/pay/[id]">) {
  return (
    <Container narrow className="py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-surface-2" />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Content({
  params,
  searchParams,
}: {
  params: PageProps<"/dev/pay/[id]">["params"];
  searchParams: PageProps<"/dev/pay/[id]">["searchParams"];
}) {
  const { id } = await params;
  const { booking } = await searchParams;
  // The backend builds the link as /dev/pay/fake-{paymentId}
  const paymentId = id.replace(/^fake-/, "");
  return <DevPayPanel paymentId={paymentId} bookingId={typeof booking === "string" ? booking : null} />;
}
