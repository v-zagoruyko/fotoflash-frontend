import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // personal and transactional pages, service endpoints
      disallow: ["/booking", "/profile", "/dev", "/api/", "/revalidate"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
