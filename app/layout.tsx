import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://postcraft.vercel.app";
const description =
  "Compose and send beautifully designed HTML email from your own inbox. 14 ready templates, a live HTML editor, and SMTP sending with your app password.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Postcraft — Compose beautiful email",
    template: "%s — Postcraft",
  },
  description,
  applicationName: "Postcraft",
  keywords: [
    "html email",
    "email templates",
    "email composer",
    "smtp",
    "gmail app password",
    "newsletter template",
    "transactional email",
  ],
  authors: [{ name: "Postcraft" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Postcraft",
    title: "Postcraft — Compose beautiful email",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Postcraft — Compose beautiful email",
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f6f3f1",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <head>
        {/* Without JS nothing animates, so the hero copy must not stay hidden. */}
        <noscript>
          <style>{`[data-intro],.statement .w{opacity:1!important;transform:none!important}.preloader{display:none!important}.faq-a{height:auto!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
