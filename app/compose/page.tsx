import type { Metadata } from "next";
import Composer from "@/components/composer/Composer";
import { SITE, absoluteUrl } from "@/lib/site";
import { TEMPLATES } from "@/lib/templates";
import "./composer.css";

export const metadata: Metadata = {
  // 43 chars with the brand suffix the root template appends.
  title: "HTML Email Editor & Sender",
  description:
    "Fill a ready-made template or write raw HTML and CSS. Preview on desktop, mobile and plain text, then send it from your own Gmail, Outlook or SMTP account.",
  alternates: { canonical: "/compose" },
  openGraph: {
    type: "website",
    url: "/compose",
    siteName: SITE.name,
    title: `HTML Email Editor & Sender — ${SITE.name}`,
    description: `Write, preview and send HTML email from your own inbox. ${TEMPLATES.length} templates and a live HTML editor, free.`,
  },
};

const breadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Composer", item: absoluteUrl("/compose") },
  ],
};

export default function ComposePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {/* The composer is a toolbar-driven app, so its page heading is for
          crawlers and screen readers rather than the layout. */}
      <h1 className="sr-only">{SITE.name} email composer — write, preview and send HTML email</h1>
      <Composer />
    </>
  );
}
