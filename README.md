# Postcraft Plum

Compose beautifully designed HTML email and send it from your own inbox.

**Live:** https://postcraft-plum.vercel.app

Postcraft Plum is a free, sign-up-free HTML email composer. Pick one of 14 hand-set,
table-based templates or write your own HTML and CSS, preview it live on desktop,
mobile and plain text, then send it through your own SMTP account.

## Features

- 14 inbox-tested email templates across onboarding, marketing, commerce and transactional categories
- Raw HTML/CSS editor with line numbers, tab indenting, import, copy and download
- Theme controls for accent, background, text colours, fonts and corner radius
- Live preview in desktop, mobile and `text/plain` modes
- Sends via Gmail, Outlook, Yahoo, Zoho, iCloud, Fastmail or any custom SMTP host
- Attachments up to 3 MB, up to 50 recipients across To, CC and BCC
- Credentials are used for a single SMTP session and never stored on the server

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · GSAP (ScrollTrigger, SplitText, DrawSVG)
· Three.js · Lenis · Nodemailer

## Running locally

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_SITE_URL` to override the canonical origin used by metadata,
the sitemap and robots.txt. It defaults to the production URL above.

## Privacy

Your email address and app password are posted to `/api/send`, used to open one
SMTP connection, and discarded when the request ends. Nothing is logged or
persisted server-side. "Remember on this device" stores credentials in your own
browser's `localStorage` only.

---

Made by Prajwal A Bhandagi
