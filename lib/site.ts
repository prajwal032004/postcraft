/**
 * One source of truth for site identity. Metadata, JSON-LD, the sitemap,
 * robots, the manifest and the OG image all read from here, so the brand and
 * the deployed origin can never drift apart.
 */

export const SITE = {
  name: "Postcraft Plum",
  /** Lowercase wordmark used in the logo, preloader and footer. */
  wordmark: "postcraft plum",
  shortName: "Postcraft",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://postcraft-plum.vercel.app").replace(/\/$/, ""),
  tagline: "Compose beautiful email",
  description:
    "Postcraft Plum is a free HTML email composer. Pick one of 14 hand-set, inbox-tested templates or write your own HTML and CSS, preview it live, then send it from your own Gmail, Outlook or any SMTP account. No sign-up, no tracking pixels, and your app password is never stored.",
  /** Short form for cards and the manifest, where long copy gets truncated. */
  shortDescription:
    "Compose beautifully designed HTML email and send it from your own inbox. 14 ready templates, a live HTML editor, and SMTP sending with your app password.",
  author: "Prajwal A Bhandagi",
  locale: "en_US",
} as const;

export const absoluteUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
