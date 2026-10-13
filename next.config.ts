import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
const isDev = process.env.NODE_ENV !== "production";

// Media URLs come from the API as absolute links: the backend itself or the site's own domain (behind the proxy).
const mediaPatterns = [backendUrl, process.env.SITE_URL]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => new URL(origin))
  .filter((url, i, all) => all.findIndex((other) => other.host === url.host) === i)
  .map((url) => ({
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    port: url.port,
    pathname: "/media/**",
  }));

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Without this Next 308-redirects /api/.../ to the slashless URL before the rewrite runs.
  skipTrailingSlashRedirect: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Frontend and API must share one origin (httpOnly session cookie + CSRF).
  // Next normalizes away the trailing slash, Django requires it: put it back in the destination.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${backendUrl}/api/v1/:path*/` }];
  },
  images: {
    remotePatterns: mediaPatterns,
    // dev backend is on localhost, which the optimizer blocks by default
    dangerouslyAllowLocalIP: isDev,
  },
};

export default nextConfig;
