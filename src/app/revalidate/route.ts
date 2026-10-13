import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

const TAGS = ["locations", "extras", "studio", "documents"];

/**
 * Drops cached catalog data right after an admin edit, instead of waiting for the cache to expire.
 * `POST /revalidate?tag=extras&tag=studio` (no tag = all), `Authorization: Bearer $REVALIDATE_SECRET`.
 * Without a secret it only works in development.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (secret) {
    const given = Buffer.from(request.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return new Response("REVALIDATE_SECRET is not set", { status: 503 });
  }

  const requested = new URL(request.url).searchParams.getAll("tag");
  const tags = requested.length > 0 ? requested.filter((tag) => TAGS.includes(tag)) : TAGS;
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
