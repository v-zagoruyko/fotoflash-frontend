"use client";

import { useEffect, useRef } from "react";

const EASE = 0.1; // share of the remaining distance covered per frame

/**
 * The hero's "lens" (desktop only). It glides after the mouse and eases back to its resting
 * place when the pointer leaves the hero. Position is applied imperatively, no React state.
 */
export function HeroLens() {
  const lensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lens = lensRef.current;
    const hero = lens?.parentElement;
    if (!lens || !hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const desktop = window.matchMedia("(min-width: 1024px)");

    const current = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let frame = 0;

    const tick = () => {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      const settled = Math.abs(target.x - current.x) < 0.2 && Math.abs(target.y - current.y) < 0.2;
      if (settled) {
        current.x = target.x;
        current.y = target.y;
      }
      lens.style.transform = target.x === 0 && target.y === 0 && settled ? "" : `translate3d(${current.x}px, ${current.y}px, 0)`;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !desktop.matches) return;
      const rect = lens.getBoundingClientRect();
      // the lens is currently shifted by `current`, so the resting center is rect center minus it
      const restX = rect.left + rect.width / 2 - current.x;
      const restY = rect.top + rect.height / 2 - current.y;
      target.x = e.clientX - restX;
      target.y = e.clientY - restY;
      start();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={lensRef}
      aria-hidden="true"
      className="absolute top-1/2 right-[3%] hidden size-[min(62vh,40vw)] -translate-y-[46%] rounded-pill border-[6px] border-white/60 bg-linear-to-r from-black/35 from-50% to-transparent to-50% shadow-[0_0_0_100vmax_rgb(8_11_14/0.6)] will-change-transform lg:block"
    />
  );
}
