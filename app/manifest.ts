import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Postcraft — Compose beautiful email",
    short_name: "Postcraft",
    description: "Compose beautifully designed HTML email and send it from your own inbox.",
    start_url: "/compose",
    display: "standalone",
    background_color: "#f6f3f1",
    theme_color: "#f6f3f1",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
