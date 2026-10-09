import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Only canonical pages. The ?template= links are the same document with a
// query string, so listing them would just advertise duplicates.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/compose"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];
}
