import { PageShell } from "@/components/layout/page-shell";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <PageShell>{children}</PageShell>;
}
