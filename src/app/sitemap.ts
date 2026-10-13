import type { MetadataRoute } from "next";
import { getLocations } from "@/lib/api/catalog";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const halls = await getLocations();
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/halls`, changeFrequency: "weekly", priority: 0.9 },
    ...halls.map((hall) => ({
      url: `${siteUrl}/halls/${hall.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
