import { HeroLens } from "@/components/home/hero-lens";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { plural } from "@/lib/plural";

type HeroProps = { hallsCount: number; minPrice: string; openTime: string; closeTime: string };

/** Full-screen video hero. Starts under the floating header (`-mt-20` cancels PageShell's top padding). */
export function Hero({ hallsCount, minPrice, openTime, closeTime }: HeroProps) {
  const hours = `${openTime}–${closeTime}`;

  return (
    <section className="relative -mt-20 flex h-dvh min-h-[40rem] items-end overflow-hidden bg-media-deep text-on-media">
      <video
        src="/video/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover motion-reduce:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-media/60 via-media/5 via-30% to-media/95"
      />

      {/* logo motif, mobile: a ring over the video, the dark half is the shadow */}
      <div
        aria-hidden="true"
        className="absolute top-[18%] left-1/2 size-[min(21rem,82vw)] -translate-x-1/2 rounded-pill border-[5px] border-white/70 bg-linear-to-r from-black/60 from-50% to-white/5 to-50% lg:hidden"
      />
      {/* logo motif, desktop: a lens on the right. The ring is a window, everything outside it is dimmed */}
      <HeroLens />

      <Container className="relative pb-7 lg:pb-16">
        <p className="type-eyebrow text-on-media-muted">Арт-пространство</p>
        <h1 className="type-display mt-3.5 max-w-xl lg:mt-5 lg:max-w-4xl lg:text-7xl lg:leading-[1.05] xl:text-[5rem]">
          Студия, где свет уже поставлен
        </h1>
        <p className="type-body mt-4 max-w-md text-on-media-muted lg:mt-6 lg:max-w-lg lg:text-xl">
          Залы, оборудование и услуги. Выберите время и оплатите онлайн за пару минут.
        </p>
        <ButtonLink href="/halls" variant="media" block className="mt-6 lg:mt-9 lg:w-auto">
          Выбрать зал и время
        </ButtonLink>

        <p className="type-caption mt-3.5 text-center text-on-media-muted lg:hidden">
          от {minPrice} в час · ежедневно {hours}
        </p>
        <dl className="mt-12 hidden gap-10 lg:flex">
          <HeroFact value={String(hallsCount)} label={`${plural(hallsCount, ["зал", "зала", "залов"])} на выбор`} />
          <HeroFact value={minPrice} label="в час, от" />
          <HeroFact value={hours} label="ежедневно" />
        </dl>
      </Container>
    </section>
  );
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-white/25 pl-5">
      <dd className="type-h4">{value}</dd>
      <dt className="type-caption mt-1 text-on-media-muted">{label}</dt>
    </div>
  );
}
