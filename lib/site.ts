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

  /* ---- search copy, written to the limits the SERP actually renders ---- */

  /** 56 chars. Keyword first, brand last — the pattern Google renders whole. */
  title: "Free HTML Email Composer & 14 Templates — Postcraft Plum",
  /** 153 chars, inside the ~158 Google shows before truncating. */
  metaDescription:
    "Free HTML email composer. Start from 14 hand-set templates or write your own HTML, preview it live, then send from your Gmail, Outlook or any SMTP inbox.",
  /** Shorter still, because social cards clip earlier than search results. */
  socialDescription:
    "14 hand-set email templates, a live HTML editor, and sending straight from your own inbox. No sign-up, no tracking pixels, no stored passwords.",
  /** Long form, used only for structured data where length is not penalised. */
  description:
    "Postcraft Plum is a free HTML email composer. Pick one of 14 hand-set, inbox-tested templates or write your own HTML and CSS, preview it live on desktop, mobile and plain text, then send it from your own Gmail, Outlook, Yahoo, Zoho, iCloud or any SMTP account. No sign-up, no tracking pixels, and your app password is never stored on the server.",

  /**
   * Keywords Google has ignored since 2009; Bing weights them near zero. Kept
   * short and honest rather than stuffed — the ranking work is in the title,
   * description, headings and page copy.
   */
  keywords: [
    "postcraft plum",
    "html email composer",
    "free html email template builder",
    "send html email from gmail",
    "online email template editor",
    "smtp email sender",
    "gmail app password smtp",
    "responsive html email templates",
    "free newsletter template html",
    "email preview tool",
  ],

  /** Webmaster-tool ownership proofs. */
  verification: {
    google: "N5z16EW8tGD83J0Mc6vgz1sFqCllk7oVyvOQSNYjanU",
    bing: "41DF851FCE84360A9074BDC7D98E6FE8",
  },

  author: "Prajwal A Bhandagi",
  locale: "en_US",
} as const;

export const absoluteUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
