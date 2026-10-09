import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.shortDescription,
    start_url: "/compose",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f6f3f1",
    theme_color: "#f6f3f1",
    categories: ["productivity", "utilities"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
