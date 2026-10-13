import type { Document } from "@/lib/api/catalog";

/**
 * Document slugs the site relies on. PDFs are uploaded in the backend admin under these codes;
 * the list and the legal reasoning live in docs/backend-requests.md.
 */
export const DOCUMENT_SLUGS = {
  offer: "public-offer",
  rules: "studio-rules",
  refund: "refund-policy",
  bonus: "bonus-program",
  privacy: "privacy-policy",
  consent: "personal-data-consent",
} as const;

const footerOrder: string[] = Object.values(DOCUMENT_SLUGS);

/** Footer order: contract and service terms first, personal-data documents last, unknown slugs at the end. */
export function sortDocuments(documents: Document[]) {
  const rank = (slug: string) => {
    const i = footerOrder.indexOf(slug);
    return i === -1 ? footerOrder.length : i;
  };
  return [...documents].sort((a, b) => rank(a.slug) - rank(b.slug));
}
