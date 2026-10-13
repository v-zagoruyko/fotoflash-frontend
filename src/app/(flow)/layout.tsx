import { PageShell } from "@/components/layout/page-shell";

export default function FlowLayout({ children }: LayoutProps<"/">) {
  return <PageShell footer={false}>{children}</PageShell>;
}
