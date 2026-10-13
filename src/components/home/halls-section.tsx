import { Container } from "@/components/layout/container";
import { HallCard } from "@/components/ui/hall-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Location } from "@/lib/api/catalog";
import { formatCount } from "@/lib/plural";

const FEATURED_COUNT = 4;

export function HallsSection({ halls }: { halls: Location[] }) {
  // The API returns halls in the admin order: the first ones are the featured ones.
  const featured = halls.slice(0, FEATURED_COUNT);

  return (
    <section id="halls" className="py-section">
      <Container>
        <SectionHeading eyebrow="Залы" title="Выберите пространство" />
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {featured.map((hall) => (
            <HallCard key={hall.slug} hall={hall} />
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <ButtonLink href="/halls" variant="secondary" size="md" className="w-full sm:w-auto sm:min-w-60">
            Все {formatCount(halls.length, ["зал", "зала", "залов"])}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
