import type { Metadata } from "next";
import { Contacts } from "@/components/home/contacts";
import { HallsSection } from "@/components/home/halls-section";
import { Hero } from "@/components/home/hero";
import { getLocations, getStudio } from "@/lib/api/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { formatMoney, formatTime } from "@/lib/format";
import { siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [halls, studio] = await Promise.all([getLocations(), getStudio()]);

  // Money is a decimal string: compare by value, keep the original string for display.
  const cheapest = halls.reduce((a, b) => (Number(b.hour_price) < Number(a.hour_price) ? b : a));
  // Working hours are the same for all halls today; the schema marks them optional.
  const { open_time = "09:00:00", close_time = "00:00:00" } = halls[0];

  // Only what the backend really knows goes into the structured data.
  const structured: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteName,
    url: siteUrl,
    image: `${siteUrl}/opengraph-image.png`,
    ...(studio.phone && { telephone: studio.phone }),
    ...(studio.email && { email: studio.email }),
    ...(studio.address && {
      address: { "@type": "PostalAddress", streetAddress: studio.address, addressCountry: "RU" },
    }),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: formatTime(open_time),
      closes: formatTime(close_time),
    },
  };

  return (
    <>
      <JsonLd data={structured} />
      <Hero
        hallsCount={halls.length}
        minPrice={formatMoney(cheapest.hour_price)}
        openTime={formatTime(open_time)}
        closeTime={formatTime(close_time)}
      />
      <HallsSection halls={halls} />
      <Contacts studio={studio} openTime={formatTime(open_time)} closeTime={formatTime(close_time)} />
    </>
  );
}
