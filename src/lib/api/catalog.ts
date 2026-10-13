import { cacheLife, cacheTag } from "next/cache";
import { api } from "./client";
import type { components } from "./schema";

export type Location = components["schemas"]["Location"];
export type Extra = components["schemas"]["Extra"];
export type ExtraCategory = components["schemas"]["ExtraCategory"];
export type Document = components["schemas"]["Document"];
export type Studio = components["schemas"]["Studio"];

// Public catalog data: same for everyone, so it is cached on the server.
// Tags let the backend drop a cache after an admin edit: POST /revalidate?tag=extras (see app/revalidate).
export async function getLocations() {
  "use cache";
  cacheLife("hours");
  cacheTag("locations");
  return api<Location[]>("/locations/");
}

export async function getExtras() {
  "use cache";
  cacheLife("hours");
  cacheTag("extras");
  return api<Extra[]>("/extras/");
}

export async function getStudio() {
  "use cache";
  cacheLife("hours");
  cacheTag("studio");
  return api<Studio>("/studio/");
}

export async function getDocuments() {
  "use cache";
  cacheLife("hours");
  cacheTag("documents");
  return api<Document[]>("/documents/");
}
