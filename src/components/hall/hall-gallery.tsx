"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Photo carousel on native scroll-snap: swipe on touch, arrows and dots with a mouse,
 * ←/→ with the keyboard. On mobile it is full-bleed and starts under the floating header.
 */
export function HallGallery({ images, title }: { images: string[]; title: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  function goTo(next: number) {
    const el = scroller.current;
    if (!el) return;
    const target = (next + images.length) % images.length;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }

  const arrow =
    "glass-media absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-pill transition hover:bg-black/70 lg:flex";

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`Фотографии: ${title}`}
      className="relative -mt-20 h-[26rem] overflow-hidden bg-surface-2 lg:mt-0 lg:h-[34rem] lg:rounded-card"
    >
      <div
        ref={scroller}
        tabIndex={0}
        className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            goTo(index - 1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            goTo(index + 1);
          }
        }}
      >
        {images.map((src, i) => (
          <div
            key={src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} из ${images.length}`}
            className="relative size-full shrink-0 snap-start"
          >
            <Image
              src={src}
              alt={`${title}, фото ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-media/50 to-transparent lg:hidden"
      />

      {many && (
        <>
          <button type="button" aria-label="Предыдущее фото" onClick={() => goTo(index - 1)} className={cn(arrow, "left-3.5")}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Следующее фото" onClick={() => goTo(index + 1)} className={cn(arrow, "right-3.5")}>
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>

          <div className="glass-media absolute bottom-9 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-pill px-2 py-1.5 lg:bottom-4">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Фото ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className="flex size-5 items-center justify-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-pill bg-white transition-all",
                    i === index ? "w-4 opacity-100" : "w-1.5 opacity-50",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
