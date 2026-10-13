import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HallBooking } from "@/components/hall/hall-booking";
import { HallGallery } from "@/components/hall/hall-gallery";
import { HallInfo } from "@/components/hall/hall-info";
import { HallSkeleton } from "@/components/hall/hall-skeleton";
import { getLocations, getStudio } from "@/lib/api/catalog";

export async function generateStaticParams() {
  const halls = await getLocations();
  return halls.map((hall) => ({ slug: hall.slug }));
}

async function getHall(slug: string) {
  const halls = await getLocations();
  return halls.find((hall) => hall.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/halls/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const hall = await getHall(slug);
  if (!hall) return {};
  const summary = hall.description?.replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: hall.title,
    description: summary || undefined,
    alternates: { canonical: `/halls/${hall.slug}` },
    openGraph: {
      title: `${hall.title} · ФОТОФЛЕШ`,
      description: summary || undefined,
      url: `/halls/${hall.slug}`,
      images: [{ url: hall.cover, alt: hall.title }],
    },
  };
}

export default function HallPage({ params }: PageProps<"/halls/[slug]">) {
  // `params` is request data: the content is streamed behind a skeleton so navigation stays instant.
  return (
    <Suspense fallback={<HallSkeleton />}>
      <HallContent params={params} />
    </Suspense>
  );
}

async function HallContent({ params }: { params: PageProps<"/halls/[slug]">["params"] }) {
  const { slug } = await params;
  const [hall, studio] = await Promise.all([getHall(slug), getStudio()]);
  if (!hall) notFound();

  // Cover first, then the rest of the gallery.
  const photos = [hall.cover, ...hall.images.map((item) => item.image)];

  return (
    <HallBooking
      slug={hall.slug}
      title={hall.title}
      minHours={hall.min_hours ?? 1}
      horizonDays={studio.booking_horizon_days}
      gallery={<HallGallery images={photos} title={hall.title} />}
      info={<HallInfo hall={hall} />}
    />
  );
}
