import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { FAQ, faqAnswerText } from "@/lib/faq";
import { SITE, absoluteUrl } from "@/lib/site";
import { TEMPLATES } from "@/lib/templates";
import { VIDEO } from "@/lib/video";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Structured data. The FAQPage block is the one most likely to earn a rich
 * result, so its wording is generated from the same source the page renders.
 */
function jsonLd() {
  const appId = absoluteUrl("/#app");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: SITE.name,
        description: SITE.socialDescription,
        inLanguage: "en",
        publisher: { "@id": absoluteUrl("/#person") },
      },
      {
        "@type": "Person",
        "@id": absoluteUrl("/#person"),
        name: SITE.author,
      },
      {
        "@type": "WebApplication",
        "@id": appId,
        name: SITE.name,
        url: absoluteUrl("/"),
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Email composer",
        operatingSystem: "Any modern web browser",
        browserRequirements: "Requires JavaScript and a WebGL-capable browser for the 3D hero",
        description: SITE.description,
        inLanguage: "en",
        author: { "@id": absoluteUrl("/#person") },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          `${TEMPLATES.length} hand-set, table-based HTML email templates`,
          "Live side-by-side desktop, mobile and plain-text preview",
          "Raw HTML and CSS editor with import, copy and download",
          "Theme controls for colour, fonts and corner radius",
          "Sends through your own SMTP account (Gmail, Outlook, Yahoo, Zoho, iCloud, Fastmail or custom)",
          "Attachments up to 3 MB and up to 50 recipients across To, CC and BCC",
          "Credentials are never stored on the server",
        ],
      },
      {
        "@type": "VideoObject",
        "@id": absoluteUrl("/#setup-video"),
        name: "How to create a Gmail app password",
        description:
          "A 25-second screen recording showing how to turn on 2-Step Verification, open the Google app passwords page, and generate the 16-character code needed to send mail through Gmail SMTP.",
        thumbnailUrl: [absoluteUrl(VIDEO.poster)],
        contentUrl: absoluteUrl(VIDEO.src),
        embedUrl: absoluteUrl("/#setup"),
        // ISO 8601; the clip is silent, so the on-page steps carry the detail.
        duration: `PT${VIDEO.seconds}S`,
        width: VIDEO.width,
        height: VIDEO.height,
        uploadDate: "2026-10-10T00:00:00+00:00",
        isFamilyFriendly: true,
        inLanguage: "en",
        publisher: { "@id": absoluteUrl("/#person") },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl("/#faq"),
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: faqAnswerText(item) },
        })),
      },
    ],
  };
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, author-controlled JSON built above — no user input reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <Landing />
    </>
  );
}
