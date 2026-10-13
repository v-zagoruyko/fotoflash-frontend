import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn("size-7", className)}>
      <circle cx="50" cy="50" r="39.5" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M50 10.5A39.5 39.5 0 0 0 50 89.5Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[0.8125rem] leading-none font-semibold tracking-[0.06em]">ФОТОФЛЕШ</span>
    </span>
  );
}
