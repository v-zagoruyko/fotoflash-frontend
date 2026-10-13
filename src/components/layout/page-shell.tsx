import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Page frame: floating header + content + optional footer.
 * `footer={false}` is for the booking flow, where a sticky action bar owns the bottom edge.
 */
export function PageShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pt-20">{children}</main>
      {footer && <SiteFooter />}
    </div>
  );
}
