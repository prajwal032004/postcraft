import type { MetadataRoute } from "next";
import { TEMPLATES } from "@/lib/templates";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://postcraft.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/compose`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...TEMPLATES.map((t) => ({
      url: `${siteUrl}/compose?template=${t.id}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
