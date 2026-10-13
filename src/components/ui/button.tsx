import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "glass" | "media";
type Size = "sm" | "md" | "lg";

type StyleProps = { variant?: Variant; size?: Size; block?: boolean };

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:opacity-90",
  secondary: "border border-line text-fg hover:border-fg/40 hover:bg-surface-2",
  ghost: "text-accent hover:bg-surface-2",
  glass: "glass text-fg hover:bg-(--glass-hover)",
  // light button for use on top of video/photos, same in both themes
  media: "bg-on-media text-black hover:bg-white",
};

const sizes: Record<Size, string> = {
  sm: "min-h-touch px-4 text-sm",
  md: "min-h-12 px-6 text-base",
  lg: "min-h-control px-7 text-base",
};

export function buttonStyles({ variant = "primary", size = "lg", block }: StyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
    variants[variant],
    sizes[size],
    block && "w-full",
  );
}

export function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: StyleProps & ComponentProps<"button">) {
  return <button type={type} className={cn(buttonStyles({ variant, size, block }), className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  block,
  className,
  ...props
}: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={cn(buttonStyles({ variant, size, block }), className)} {...props} />;
}
