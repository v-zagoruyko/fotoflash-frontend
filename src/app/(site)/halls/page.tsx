import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { HallCard } from "@/components/ui/hall-card";
import { getLocations } from "@/lib/api/catalog";
import { bentoLayout } from "@/lib/bento";
import { formatCount } from "@/lib/plural";

export const metadata: Metadata = {
  title: "Залы",
  description: "Все залы фотостудии ФОТОФЛЕШ в Тюмени: цены, оборудование и свободное время.",
  alternates: { canonical: "/halls" },
  openGraph: { title: "Залы · ФОТОФЛЕШ", url: "/halls" },
};

const cardSizes = "(min-width: 1024px) 660px, (min-width: 768px) 50vw, 100vw";

export default async function HallsPage() {
  const halls = await getLocations();
  // The API returns halls in the admin order, the first ones get the big cells.
  const layout = bentoLayout(halls.length);

  return (
    <Container className="py-8 md:py-12">
      <p className="type-eyebrow text-muted">Каталог</p>
      <h1 className="type-h1 mt-2.5">Залы</h1>
      <p className="type-body mt-3 max-w-xl text-muted">
        {formatCount(halls.length, ["зал", "зала", "залов"])}. Цены и свободное время видны на странице зала.
      </p>

      {/* Bento grid: cell i is the span for hall i; on mobile it is a plain stack of cards */}
      <div className="mt-8 grid gap-4 md:auto-rows-[13rem] md:grid-flow-dense md:grid-cols-2 lg:auto-rows-[14rem] lg:grid-cols-4">
        {halls.map((hall, i) => (
          <div key={hall.slug} className={layout[i].span}>
            <HallCard
              hall={hall}
              sizes={cardSizes}
              priority={i < 2}
              heightClass="h-84 md:h-full"
              maxLines={layout[i].compact ? 3 : 6}
              featured={layout[i].featured}
              descriptionClass={layout[i].area < 2 ? "md:hidden" : ""}
            />
          </div>
        ))}
      </div>
    </Container>
  );
}
