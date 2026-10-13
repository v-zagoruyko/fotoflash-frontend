import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Dev-only pages (component catalog, fake payment). Never part of the production site.
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();
  return <PageShell>{children}</PageShell>;
}
