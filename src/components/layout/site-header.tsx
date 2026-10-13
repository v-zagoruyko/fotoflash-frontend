import Link from "next/link";
import { HeaderAuth } from "@/components/auth/header-auth";
import { HeaderBooking } from "@/components/auth/header-booking";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Floating glass header. Pages with a full-bleed hero pull themselves under it with `-mt-20`. */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-3 top-3 z-40 mx-auto max-w-page">
      <div className="glass flex h-15 items-center justify-between rounded-pill pr-2 pl-4.5">
        <Link href="/" aria-label="ФОТОФЛЕШ, на главную" className="flex items-center text-fg transition-opacity hover:opacity-70">
          <Logo />
        </Link>
        <div className="flex items-center gap-1.5 text-fg">
          <ThemeToggle />
          <HeaderBooking />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
