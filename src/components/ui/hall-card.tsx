import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ExpandableText } from "@/components/ui/expandable-text";
import type { Location } from "@/lib/api/catalog";
import { formatMoney } from "@/lib/format";

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const defaultSizes = "(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw";

/**
 * Hall card. On hover/focus the scrim deepens and the text block rises:
 * the description opens from 2 lines to its full height (up to 6) and a "pick a time" row fades in
 * underneath. The row is positioned absolutely and the text is lifted with a transform,
 * so nothing reflows when it appears.
 * Collapsed height is exactly two body-sm lines (2 × 1.45 × 0.9375rem), the clip never cuts a line.
 */
export function HallCard({
  hall,
  priority,
  sizes = defaultSizes,
  heightClass = "h-84",
  maxLines = 6,
  featured,
  descriptionClass = "",
}: {
  hall: Location;
  priority?: boolean;
  /** `sizes` attribute for the cover; override when the card is narrower than the default grid */
  sizes?: string;
  /** Tailwind height classes; lets a masonry grid vary card heights (breakpoint-prefixed classes work) */
  heightClass?: string;
  /** how many description lines the hover state may open to */
  maxLines?: number;
  /** larger title for cards that take a big cell */
  featured?: boolean;
  /** extra classes for the description, e.g. `md:hidden` to drop it in small bento cells */
  descriptionClass?: string;
}) {
  const description = hall.description?.replace(/\r/g, "").replace(/\n{2,}/g, "\n").trim();

  return (
    <Link
      href={`/halls/${hall.slug}`}
      className={`group relative block ${heightClass} overflow-hidden rounded-card bg-surface-2 text-on-media transition-transform active:scale-[0.99]`}
    >
      <Image
        src={hall.cover}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-transparent from-40% to-media/90" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-media/25 to-media/95 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <span className="glass-media type-title absolute top-3.5 left-3.5 inline-flex min-h-9 items-center rounded-pill px-3.5 text-sm">
        {formatMoney(hall.hour_price)} / час
      </span>

      <div
        className={`absolute inset-x-4.5 bottom-4.5 transition-transform duration-700 ${ease} group-hover:-translate-y-8 group-focus-visible:-translate-y-8`}
      >
        <h3 className={featured ? "type-h2" : "type-h3"}>{hall.title}</h3>
        {description && (
          <ExpandableText
            maxFull={`calc(${maxLines}*1.45*0.9375rem)`}
            className={`type-body-sm mt-2 max-h-[calc(2*1.45*0.9375rem)] whitespace-pre-line text-on-media-muted transition-[max-height] duration-700 ${ease} group-hover:max-h-[min(var(--full,8rem),var(--cap))] group-focus-visible:max-h-[min(var(--full,8rem),var(--cap))] ${descriptionClass}`}
          >
            {description}
          </ExpandableText>
        )}
      </div>

      <span
        className={`type-title absolute bottom-4.5 left-4.5 inline-flex translate-y-2 items-center gap-2 leading-5 opacity-0 transition duration-500 delay-100 ${ease} group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100`}
      >
        Выбрать время
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
