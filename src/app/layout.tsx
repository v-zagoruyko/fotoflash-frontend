import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { getDocuments } from "@/lib/api/catalog";
import { DOCUMENT_SLUGS } from "@/lib/documents";
import { siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: `%s · ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#080b0e" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The shell must survive a backend outage: without the document the link is just not shown.
  const documents = await getDocuments().catch(() => []);
  const consentUrl = documents.find((doc) => doc.slug === DOCUMENT_SLUGS.consent)?.url;

  return (
    <html
      lang="ru"
      className={`${onest.variable} ${unbounded.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <AuthProvider consentUrl={consentUrl}>{children}</AuthProvider>
      </body>
    </html>
  );
}
