// Email template library. Every template renders a complete, table-based HTML
// document with inline styles so it survives Gmail, Outlook and Apple Mail.

export type FieldType = "text" | "textarea" | "url" | "list";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  default: string;
  hint?: string;
}

export interface Theme {
  accent: string;
  accentText: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  font: string;
  headingFont: string;
  radius: number;
  extraCss: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  subject: string;
  swatch: [string, string];
  theme: Partial<Theme>;
  fields: Field[];
  render: (v: Record<string, string>, t: Theme) => string;
}

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "System Sans", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia Serif", value: "Georgia, 'Times New Roman', Times, serif" },
  { label: "Times", value: "'Times New Roman', Times, serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', Tahoma, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Monospace", value: "'Courier New', Courier, monospace" },
];

export const BASE_THEME: Theme = {
  accent: "#2b59d1",
  accentText: "#ffffff",
  bg: "#f6f3f1",
  surface: "#ffffff",
  text: "#242424",
  muted: "#6b6968",
  border: "#e4e0dd",
  font: FONT_OPTIONS[0].value,
  headingFont: FONT_OPTIONS[2].value,
  radius: 16,
  extraCss: "",
};

/* ---------- helpers ---------- */

export function esc(s: string = ""): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(u: string = ""): string {
  const s = u.trim();
  if (!s) return "#";
  if (/^(https?:|mailto:|tel:)/i.test(s)) return esc(s);
  if (/^[\w.-]+\.[a-z]{2,}/i.test(s)) return esc("https://" + s);
  return "#";
}

/** Multi-line text -> paragraphs */
function paras(s: string, t: Theme, size = 16): string {
  return String(s || "")
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${t.font};font-size:${size}px;line-height:1.6;color:${t.text};">${esc(p).replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}

/** "a | b | c" lines -> string[][] */
function rows(s: string): string[][] {
  return String(s || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split("|").map((c) => c.trim()));
}

function lines(s: string): string[] {
  return String(s || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function button(label: string, href: string, t: Theme, opts: { bg?: string; color?: string } = {}): string {
  const bg = opts.bg ?? t.accent;
  const color = opts.color ?? t.accentText;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;"><tr><td align="center" bgcolor="${bg}" style="border-radius:999px;background:${bg};">
<a href="${safeUrl(href)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${t.font};font-size:15px;font-weight:600;color:${color};text-decoration:none;border-radius:999px;letter-spacing:0.2px;">${esc(label)}</a>
</td></tr></table>`;
}

function heading(text: string, t: Theme, size = 30): string {
  return `<h1 style="margin:0 0 16px;font-family:${t.headingFont};font-size:${size}px;line-height:1.2;font-weight:400;letter-spacing:-0.5px;color:${t.text};">${esc(text)}</h1>`;
}

function eyebrow(text: string, t: Theme, color?: string): string {
  return `<p style="margin:0 0 12px;font-family:${t.font};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${color ?? t.muted};">${esc(text)}</p>`;
}

function divider(t: Theme): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:1px;line-height:1px;font-size:0;background:${t.border};">&nbsp;</td></tr></table>`;
}

const label = (t: Theme) =>
  `font-family:${t.font};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${t.muted};`;

function shell(t: Theme, opts: { preheader?: string; title?: string; inner: string; footer?: string; pad?: number }): string {
  const pad = opts.pad ?? 40;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${esc(opts.title || "")}</title>
<style>
  body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  img{border:0;outline:none;text-decoration:none;max-width:100%;height:auto;display:block;}
  a{color:${t.accent};}
  @media only screen and (max-width:620px){
    .container{width:100%!important;}
    .pad{padding:24px!important;}
    .stack{display:block!important;width:100%!important;}
  }
${t.extraCss}
</style>
</head>
<body style="margin:0;padding:0;background:${t.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader || "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.bg}" style="background:${t.bg};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
<tr><td class="${pad ? "pad" : ""}" bgcolor="${t.surface}" style="background:${t.surface};border-radius:${t.radius}px;border:1px solid ${t.border};padding:${pad}px;">
${opts.inner}
</td></tr>
${
  opts.footer
    ? `<tr><td align="center" style="padding:24px 16px;font-family:${t.font};font-size:12px;line-height:1.6;color:${t.muted};">${opts.footer}</td></tr>`
    : ""
}
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ---------- templates ---------- */

export const TEMPLATES: Template[] = [
  {
    id: "welcome",
    name: "Warm Welcome",
    category: "Onboarding",
    description: "Greet new users with a calm, editorial hello.",
    subject: "Welcome to {{brand}}, {{name}}",
    swatch: ["#cfdaf5", "#2b59d1"],
    theme: {},
    fields: [
      { key: "brand", label: "Brand name", type: "text", default: "Northwind" },
      { key: "name", label: "Recipient name", type: "text", default: "Prajwal" },
      { key: "headline", label: "Headline", type: "text", default: "We're glad you're here." },
      { key: "body", label: "Message", type: "textarea", default: "Your account is ready. Everything you need to get started is one click away.\n\nIf you ever get stuck, just reply to this email. A real person reads every message." },
      { key: "steps", label: "Getting-started steps", type: "list", default: "Complete your profile\nInvite your team\nCreate your first project", hint: "One step per line" },
      { key: "ctaLabel", label: "Button label", type: "text", default: "Open your dashboard" },
      { key: "ctaUrl", label: "Button link", type: "url", default: "https://example.com" },
      { key: "signoff", label: "Sign-off", type: "text", default: "— The Northwind team" },
    ],
    render: (v, t) =>
      shell(t, {
        title: v.headline,
        preheader: `Welcome aboard, ${v.name}`,
        inner: `${eyebrow(v.brand, t)}
${heading(`Hi ${v.name}. ${v.headline}`, t, 34)}
${paras(v.body, t)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
${lines(v.steps)
  .map(
    (s, i) => `<tr><td width="40" valign="top" style="padding:10px 0;border-bottom:1px solid ${t.border};"><div style="width:28px;height:28px;line-height:28px;border-radius:999px;background:${t.accent};color:${t.accentText};text-align:center;font-family:${t.font};font-size:13px;">${i + 1}</div></td>
<td style="padding:10px 0;font-family:${t.font};font-size:15px;color:${t.text};border-bottom:1px solid ${t.border};">${esc(s)}</td></tr>`
  )
  .join("")}
</table>
${button(v.ctaLabel, v.ctaUrl, t)}
<p style="margin:24px 0 0;font-family:${t.font};font-size:15px;color:${t.muted};">${esc(v.signoff)}</p>`,
        footer: `You're receiving this because you signed up for ${esc(v.brand)}.`,
      }),
  },

  {
    id: "newsletter",
    name: "Editorial Newsletter",
    category: "Newsletter",
    description: "A magazine-style digest with a lead story and briefs.",
    subject: "{{brand}} — Issue {{issue}}: {{headline}}",
    swatch: ["#ecda98", "#242424"],
    theme: { surface: "#fffdfa", accent: "#242424" },
    fields: [
      { key: "brand", label: "Publication name", type: "text", default: "The Weekly Ledger" },
      { key: "issue", label: "Issue number", type: "text", default: "42" },
      { key: "date", label: "Date", type: "text", default: "October 9, 2026" },
      { key: "headline", label: "Lead headline", type: "text", default: "Why slow software is having a moment" },
      { key: "lead", label: "Lead story", type: "textarea", default: "Teams are trading speed for craft. This week we look at three companies that shipped less and earned more trust." },
      { key: "leadUrl", label: "Lead story link", type: "url", default: "https://example.com/story" },
      { key: "briefs", label: "Briefs", type: "list", default: "Design systems that age well | Five patterns that survived a decade | https://example.com/1\nThe return of the long read | Attention is back in fashion | https://example.com/2\nTools we loved this month | A short list, honestly reviewed | https://example.com/3", hint: "Title | Summary | Link — one per line" },
      { key: "footer", label: "Footer note", type: "text", default: "Forwarded this? Subscribe at example.com" },
    ],
    render: (v, t) =>
      shell(t, {
        title: v.headline,
        preheader: v.lead,
        inner: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-family:${t.headingFont};font-size:26px;color:${t.text};">${esc(v.brand)}</td>
<td align="right" style="${label(t)}">No. ${esc(v.issue)} · ${esc(v.date)}</td>
</tr></table>
<div style="height:20px"></div>${divider(t)}<div style="height:28px"></div>
${eyebrow("Lead story", t)}
${heading(v.headline, t, 36)}
${paras(v.lead, t, 17)}
<p style="margin:0 0 32px;"><a href="${safeUrl(v.leadUrl)}" style="font-family:${t.font};font-size:14px;letter-spacing:1px;text-transform:uppercase;color:${t.text};">Read the story →</a></p>
${divider(t)}
${rows(v.briefs)
  .map(
    ([title, summary, url]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:22px 0;border-bottom:1px solid ${t.border};">
<a href="${safeUrl(url)}" style="text-decoration:none;font-family:${t.headingFont};font-size:21px;color:${t.text};">${esc(title)}</a>
<p style="margin:6px 0 0;font-family:${t.font};font-size:15px;color:${t.muted};">${esc(summary || "")}</p>
</td></tr></table>`
  )
  .join("")}`,
        footer: esc(v.footer),
      }),
  },

  {
    id: "launch",
    name: "Product Launch",
    category: "Marketing",
    description: "Announce something new with a bold hero and feature list.",
    subject: "Introducing {{product}}",
    swatch: ["#a0b5eb", "#a7fccd"],
    theme: { bg: "#eef1fb" },
    fields: [
      { key: "brand", label: "Brand", type: "text", default: "Lumen" },
      { key: "product", label: "Product name", type: "text", default: "Lumen Studio" },
      { key: "tagline", label: "Tagline", type: "text", default: "The calmest way to build beautiful things." },
      { key: "image", label: "Hero image URL (optional)", type: "url", default: "" },
      { key: "description", label: "Description", type: "textarea", default: "After two years in private beta, Lumen Studio is available to everyone today. It brings your files, feedback and releases into one quiet place." },
      { key: "features", label: "Features", type: "list", default: "Real-time collaboration\nVersion history forever\nOne-click publishing", hint: "One feature per line" },
      { key: "price", label: "Price line", type: "text", default: "Free for individuals · $12/mo for teams" },
      { key: "ctaLabel", label: "Button label", type: "text", default: "Try it free" },
      { key: "ctaUrl", label: "Button link", type: "url", default: "https://example.com" },
    ],
    render: (v, t) =>
      shell(t, {
        title: v.product,
        preheader: v.tagline,
        pad: 0,
        inner: `${
          v.image
            ? `<img src="${safeUrl(v.image)}" alt="${esc(v.product)}" width="600" style="width:100%;border-radius:${t.radius}px ${t.radius}px 0 0;">`
            : `<div style="height:220px;border-radius:${t.radius}px ${t.radius}px 0 0;background:#a0b5eb;background-image:linear-gradient(135deg,#ff9473 0%,#a0b5eb 50%,#a7fccd 100%);"></div>`
        }
<div class="pad" style="padding:40px;">
${eyebrow(`New from ${v.brand}`, t)}
${heading(v.product, t, 40)}
<p style="margin:0 0 20px;font-family:${t.headingFont};font-size:20px;font-style:italic;color:${t.muted};">${esc(v.tagline)}</p>
${paras(v.description, t)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-collapse:separate;">
${lines(v.features)
  .map(
    (f) => `<tr><td style="padding:12px 18px;font-family:${t.font};font-size:15px;color:${t.text};border:1px solid ${t.border};border-radius:999px;">✦ &nbsp;${esc(f)}</td></tr><tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`
  )
  .join("")}
</table>
<p style="margin:0 0 16px;font-family:${t.font};font-size:14px;color:${t.muted};">${esc(v.price)}</p>
${button(v.ctaLabel, v.ctaUrl, t)}
</div>`,
        footer: `© ${esc(v.brand)}. All rights reserved.`,
      }),
  },

  {
    id: "event",
    name: "Event Invitation",
    category: "Events",
    description: "An elegant dark invite with date, venue and RSVP.",
    subject: "You're invited: {{event}}",
    swatch: ["#242424", "#ecda98"],
    theme: { bg: "#1c1b1a", surface: "#242424", text: "#f6f3f1", muted: "#b3afac", border: "#3a3837", accent: "#ecda98", accentText: "#242424" },
    fields: [
      { key: "event", label: "Event name", type: "text", default: "An Evening of Design" },
      { key: "host", label: "Hosted by", type: "text", default: "Studio Meridian" },
      { key: "name", label: "Guest name", type: "text", default: "Sam" },
      { key: "date", label: "Date", type: "text", default: "Friday, November 14" },
      { key: "time", label: "Time", type: "text", default: "7:00 PM – 10:00 PM" },
      { key: "venue", label: "Venue", type: "text", default: "The Glasshouse, 21 Harbour Street" },
      { key: "details", label: "Details", type: "textarea", default: "Join us for conversation, small plates and a first look at our new collection. Dress is smart casual." },
      { key: "rsvpUrl", label: "RSVP link", type: "url", default: "https://example.com/rsvp" },
    ],
    render: (v, t) => {
      const cell = (k: string, val: string, mid = false) =>
        `<td class="stack" width="33%" align="center" style="padding:20px 8px;font-family:${t.font};${mid ? `border-left:1px solid ${t.border};border-right:1px solid ${t.border};` : ""}"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${t.muted};">${k}</div><div style="margin-top:6px;font-size:15px;color:${t.text};">${esc(val)}</div></td>`;
      return shell(t, {
        title: v.event,
        preheader: `${v.date} · ${v.venue}`,
        inner: `<div style="text-align:center;">
${eyebrow(`${v.host} requests your company`, t, t.accent)}
<h1 style="margin:8px 0 24px;font-family:${t.headingFont};font-size:44px;line-height:1.1;font-weight:400;color:${t.text};">${esc(v.event)}</h1>
<p style="margin:0 0 28px;font-family:${t.font};font-size:16px;color:${t.muted};">Dear ${esc(v.name)},</p>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-top:1px solid ${t.border};border-bottom:1px solid ${t.border};">
<tr>${cell("Date", v.date)}${cell("Time", v.time, true)}${cell("Venue", v.venue)}</tr></table>
<div style="text-align:center;">${paras(v.details, t)}</div>
<table role="presentation" align="center" cellpadding="0" cellspacing="0"><tr><td>${button("RSVP now", v.rsvpUrl, t)}</td></tr></table>`,
        footer: `Hosted by ${esc(v.host)}`,
      });
    },
  },

  {
    id: "order",
    name: "Order Confirmation",
    category: "Transactional",
    description: "A clear receipt with line items and totals.",
    subject: "Order #{{order}} confirmed",
    swatch: ["#a7fccd", "#242424"],
    theme: {},
    fields: [
      { key: "store", label: "Store name", type: "text", default: "Fern & Field" },
      { key: "name", label: "Customer name", type: "text", default: "Jordan" },
      { key: "order", label: "Order number", type: "text", default: "10482" },
      { key: "date", label: "Order date", type: "text", default: "Oct 9, 2026" },
      { key: "items", label: "Items", type: "list", default: "Linen throw, oat | 1 | $68.00\nCeramic mug set | 2 | $48.00\nBeeswax candle | 3 | $27.00", hint: "Item | Qty | Price — one per line" },
      { key: "shipping", label: "Shipping", type: "text", default: "$6.00" },
      { key: "total", label: "Total", type: "text", default: "$149.00" },
      { key: "address", label: "Shipping address", type: "textarea", default: "Jordan Lee\n88 Willow Lane\nPortland, OR 97205" },
      { key: "trackUrl", label: "Tracking link", type: "url", default: "https://example.com/track" },
    ],
    render: (v, t) => {
      const th = `padding:10px 0;border-bottom:1px solid ${t.border};${label(t)}`;
      const td = `padding:14px 0;border-bottom:1px solid ${t.border};`;
      return shell(t, {
        title: `Order ${v.order}`,
        preheader: `Thanks for your order, ${v.name}`,
        inner: `${eyebrow(v.store, t)}
${heading(`Thanks, ${v.name}. Your order is confirmed.`, t, 30)}
<p style="margin:0 0 24px;font-family:${t.font};font-size:14px;color:${t.muted};">Order #${esc(v.order)} · ${esc(v.date)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${t.font};font-size:15px;color:${t.text};">
<tr><td style="${th}">Item</td><td align="center" style="${th}">Qty</td><td align="right" style="${th}">Price</td></tr>
${rows(v.items)
  .map(([item, qty, price]) => `<tr><td style="${td}">${esc(item)}</td><td align="center" style="${td}">${esc(qty || "1")}</td><td align="right" style="${td}">${esc(price || "")}</td></tr>`)
  .join("")}
<tr><td colspan="2" style="padding:12px 0;color:${t.muted};">Shipping</td><td align="right" style="padding:12px 0;">${esc(v.shipping)}</td></tr>
<tr><td colspan="2" style="padding:12px 0;font-size:18px;">Total</td><td align="right" style="padding:12px 0;font-size:18px;">${esc(v.total)}</td></tr>
</table>
<div style="margin:24px 0;padding:20px;border-radius:${Math.max(t.radius - 4, 0)}px;background:${t.bg};font-family:${t.font};font-size:14px;line-height:1.6;color:${t.text};">
<div style="${label(t)}margin-bottom:6px;">Ships to</div>${esc(v.address).replace(/\n/g, "<br>")}</div>
${button("Track your order", v.trackUrl, t)}`,
        footer: `Questions? Reply to this email and ${esc(v.store)} will help.`,
      });
    },
  },

  {
    id: "reset",
    name: "Password Reset",
    category: "Security",
    description: "A focused security email with a code and button.",
    subject: "Reset your {{brand}} password",
    swatch: ["#f6f3f1", "#4e4d4d"],
    theme: { headingFont: FONT_OPTIONS[0].value },
    fields: [
      { key: "brand", label: "Brand", type: "text", default: "Keystone" },
      { key: "name", label: "Recipient name", type: "text", default: "Taylor" },
      { key: "code", label: "Verification code", type: "text", default: "482 913" },
      { key: "resetUrl", label: "Reset link", type: "url", default: "https://example.com/reset" },
      { key: "expiry", label: "Expires in", type: "text", default: "30 minutes" },
      { key: "support", label: "Support email", type: "text", default: "support@example.com" },
    ],
    render: (v, t) =>
      shell(t, {
        title: "Reset your password",
        preheader: `Your code is ${v.code}`,
        inner: `<div style="width:48px;height:48px;line-height:48px;border-radius:999px;background:${t.bg};text-align:center;font-size:22px;margin-bottom:20px;">🔐</div>
${heading("Reset your password", t, 28)}
${paras(`Hi ${v.name}, we received a request to reset the password for your ${v.brand} account. Use the code below or the button to choose a new one.`, t)}
<div style="margin:8px 0 24px;padding:22px;text-align:center;border:1px dashed ${t.border};border-radius:${t.radius}px;font-family:'Courier New',monospace;font-size:32px;letter-spacing:8px;color:${t.text};">${esc(v.code)}</div>
${button("Choose a new password", v.resetUrl, t)}
<p style="margin:20px 0 0;font-family:${t.font};font-size:14px;line-height:1.6;color:${t.muted};">This link expires in ${esc(v.expiry)}. If you didn't ask for this, you can safely ignore this email. Your password won't change.</p>`,
        footer: `Need help? Contact ${esc(v.support)}`,
      }),
  },

  {
    id: "sale",
    name: "Seasonal Sale",
    category: "Marketing",
    description: "A loud-but-tasteful promo with a coupon code.",
    subject: "{{discount}} — {{headline}}",
    swatch: ["#ff9473", "#f37a0a"],
    theme: { bg: "#fff1ea", accent: "#242424", border: "#f3d6c8" },
    fields: [
      { key: "brand", label: "Brand", type: "text", default: "Atelier Sol" },
      { key: "discount", label: "Discount", type: "text", default: "40% OFF" },
      { key: "headline", label: "Headline", type: "text", default: "The autumn edit is here" },
      { key: "body", label: "Body", type: "textarea", default: "Our warmest pieces, now at the lowest prices of the season. Stock is limited, so don't wait too long." },
      { key: "code", label: "Coupon code", type: "text", default: "AUTUMN40" },
      { key: "expires", label: "Expiry note", type: "text", default: "Ends Sunday at midnight" },
      { key: "ctaUrl", label: "Shop link", type: "url", default: "https://example.com/sale" },
    ],
    render: (v, t) =>
      shell(t, {
        title: v.headline,
        preheader: `${v.discount} with code ${v.code}`,
        pad: 0,
        inner: `<div style="padding:56px 40px;text-align:center;border-radius:${t.radius}px ${t.radius}px 0 0;background:#ff9473;background-image:linear-gradient(135deg,#ecda98 0%,#ff9473 55%,#f37a0a 100%);">
<p style="margin:0 0 8px;font-family:${t.font};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#242424;">${esc(v.brand)}</p>
<div style="font-family:${t.headingFont};font-size:72px;line-height:1;color:#242424;">${esc(v.discount)}</div>
</div>
<div class="pad" style="padding:40px;text-align:center;">
${heading(v.headline, t, 32)}
${paras(v.body, t)}
<div style="display:inline-block;margin:8px 0 20px;padding:14px 28px;border:1px dashed #242424;border-radius:999px;font-family:'Courier New',monospace;font-size:20px;letter-spacing:4px;color:#242424;">${esc(v.code)}</div>
<table role="presentation" align="center" cellpadding="0" cellspacing="0"><tr><td>${button("Shop the sale", v.ctaUrl, t)}</td></tr></table>
<p style="margin:16px 0 0;font-family:${t.font};font-size:13px;color:${t.muted};">${esc(v.expires)}</p>
</div>`,
        footer: `${esc(v.brand)} · Unsubscribe anytime.`,
      }),
  },

  {
    id: "feedback",
    name: "Feedback Request",
    category: "Engagement",
    description: "Ask for a rating with one-click score buttons.",
    subject: "How did we do, {{name}}?",
    swatch: ["#a7fccd", "#2b59d1"],
    theme: {},
    fields: [
      { key: "brand", label: "Brand", type: "text", default: "Harbor" },
      { key: "name", label: "Recipient name", type: "text", default: "Riley" },
      { key: "question", label: "Question", type: "text", default: "How likely are you to recommend Harbor to a friend?" },
      { key: "intro", label: "Intro", type: "textarea", default: "Thanks for being with us this month. We'd love to hear how it's going. It takes one click." },
      { key: "baseUrl", label: "Rating link base", type: "url", default: "https://example.com/rate?score=", hint: "The score 1–5 is appended to this link" },
      { key: "signoff", label: "Sign-off", type: "text", default: "Thank you — Maya, Customer Success" },
    ],
    render: (v, t) =>
      shell(t, {
        title: "Quick question",
        preheader: v.question,
        inner: `${eyebrow(v.brand, t)}
${heading(`Hi ${v.name}, quick question.`, t, 30)}
${paras(v.intro, t)}
<p style="margin:8px 0 16px;font-family:${t.headingFont};font-size:21px;line-height:1.35;color:${t.text};">${esc(v.question)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;"><tr>
${[1, 2, 3, 4, 5]
  .map(
    (n) => `<td align="center" style="padding:4px;"><a href="${safeUrl((v.baseUrl || "") + n)}" style="display:block;padding:14px 0;border:1px solid ${t.border};border-radius:999px;font-family:${t.font};font-size:18px;color:${t.text};text-decoration:none;">${["😞", "🙁", "😐", "🙂", "😍"][n - 1]}<br><span style="font-size:12px;color:${t.muted};">${n}</span></a></td>`
  )
  .join("")}
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:6px 8px;font-family:${t.font};font-size:12px;color:${t.muted};">Not likely</td><td align="right" style="padding:6px 8px;font-family:${t.font};font-size:12px;color:${t.muted};">Very likely</td></tr></table>
<p style="margin:28px 0 0;font-family:${t.font};font-size:15px;color:${t.muted};">${esc(v.signoff)}</p>`,
        footer: `${esc(v.brand)} · We read every response.`,
      }),
  },

  {
    id: "followup",
    name: "Meeting Follow-up",
    category: "Business",
    description: "Recap a meeting with action items and next steps.",
    subject: "Recap: {{topic}}",
    swatch: ["#cecac8", "#242424"],
    theme: { headingFont: FONT_OPTIONS[0].value, radius: 8 },
    fields: [
      { key: "name", label: "Recipient name", type: "text", default: "Priya" },
      { key: "topic", label: "Meeting topic", type: "text", default: "Q4 partnership planning" },
      { key: "summary", label: "Summary", type: "textarea", default: "Thanks for the time today. Here's a quick recap so we're aligned on what happens next." },
      { key: "actions", label: "Action items", type: "list", default: "Share revised proposal | Me | Oct 14\nConfirm budget range | Priya | Oct 16\nSchedule technical review | Both | Oct 20", hint: "Task | Owner | Due — one per line" },
      { key: "next", label: "Next steps", type: "textarea", default: "Once the proposal is approved we'll kick off onboarding the following week." },
      { key: "calUrl", label: "Booking link", type: "url", default: "https://example.com/book" },
      { key: "sender", label: "Your name", type: "text", default: "Daniel Okafor" },
      { key: "title", label: "Your title & company", type: "text", default: "Partnerships Lead, Brightline" },
    ],
    render: (v, t) => {
      const th = `padding:10px 14px;${label(t)}`;
      const td = `padding:12px 14px;border-top:1px solid ${t.border};`;
      return shell(t, {
        title: v.topic,
        preheader: `Recap and next steps for ${v.topic}`,
        inner: `${paras(`Hi ${v.name},`, t)}
${paras(v.summary, t)}
${eyebrow(`Action items · ${v.topic}`, t)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;font-family:${t.font};font-size:14px;color:${t.text};border:1px solid ${t.border};">
<tr bgcolor="${t.bg}"><td style="${th}">Task</td><td style="${th}">Owner</td><td style="${th}">Due</td></tr>
${rows(v.actions)
  .map(([task, owner, due]) => `<tr><td style="${td}">${esc(task)}</td><td style="${td}">${esc(owner || "")}</td><td style="${td}white-space:nowrap;">${esc(due || "")}</td></tr>`)
  .join("")}
</table>
${paras(v.next, t)}
${button("Book the next call", v.calUrl, t)}
<div style="margin-top:28px;padding-top:20px;border-top:1px solid ${t.border};font-family:${t.font};font-size:14px;line-height:1.5;color:${t.text};"><strong>${esc(v.sender)}</strong><br><span style="color:${t.muted};">${esc(v.title)}</span></div>`,
      });
    },
  },

  {
    id: "offer",
    name: "Job Offer",
    category: "HR",
    description: "A warm, formal offer letter with key terms.",
    subject: "Your offer from {{company}}",
    swatch: ["#cfdaf5", "#242424"],
    theme: { bg: "#eef2fb" },
    fields: [
      { key: "company", label: "Company", type: "text", default: "Brightline Labs" },
      { key: "name", label: "Candidate name", type: "text", default: "Morgan" },
      { key: "role", label: "Role", type: "text", default: "Senior Product Designer" },
      { key: "start", label: "Start date", type: "text", default: "November 3, 2026" },
      { key: "comp", label: "Compensation", type: "text", default: "$148,000 base + equity" },
      { key: "location", label: "Location", type: "text", default: "Remote (US)" },
      { key: "message", label: "Message", type: "textarea", default: "Everyone you met was excited by your thinking and your craft. We'd be thrilled to have you join the team.\n\nThe full offer letter is attached. Take the time you need, and let us know if anything is unclear." },
      { key: "acceptUrl", label: "Accept link", type: "url", default: "https://example.com/accept" },
      { key: "hr", label: "Signed by", type: "text", default: "Ana Ruiz, Head of People" },
    ],
    render: (v, t) =>
      shell(t, {
        title: `Offer: ${v.role}`,
        preheader: `Congratulations, ${v.name}!`,
        inner: `${eyebrow(v.company, t)}
${heading(`Congratulations, ${v.name}.`, t, 38)}
${paras(`We're delighted to offer you the role of ${v.role}.`, t, 18)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
${[
  ["Role", v.role],
  ["Start date", v.start],
  ["Compensation", v.comp],
  ["Location", v.location],
]
  .map(
    ([k, val]) => `<tr><td style="padding:14px 0;border-bottom:1px solid ${t.border};${label(t)}">${k}</td><td align="right" style="padding:14px 0;border-bottom:1px solid ${t.border};font-family:${t.font};font-size:15px;color:${t.text};">${esc(val)}</td></tr>`
  )
  .join("")}
</table>
${paras(v.message, t)}
${button("Review & accept offer", v.acceptUrl, t)}
<p style="margin:28px 0 0;font-family:${t.headingFont};font-size:20px;font-style:italic;color:${t.text};">${esc(v.hr)}</p>`,
        footer: `${esc(v.company)} · Confidential`,
      }),
  },

  {
    id: "birthday",
    name: "Birthday Card",
    category: "Personal",
    description: "A cheerful greeting card with a pastel wash.",
    subject: "Happy birthday, {{name}}! 🎉",
    swatch: ["#ff9473", "#a7fccd"],
    theme: { bg: "#fdf3ee" },
    fields: [
      { key: "name", label: "Recipient name", type: "text", default: "Chris" },
      { key: "headline", label: "Headline", type: "text", default: "Happy birthday!" },
      { key: "message", label: "Message", type: "textarea", default: "Another trip around the sun, and you make every one of them brighter. Wishing you a year full of good coffee, long walks and big laughs." },
      { key: "from", label: "From", type: "text", default: "With love, Jamie" },
      { key: "giftUrl", label: "Gift link (optional)", type: "url", default: "" },
    ],
    render: (v, t) =>
      shell(t, {
        title: v.headline,
        preheader: `A little note for ${v.name}`,
        pad: 0,
        inner: `<div style="padding:64px 40px;text-align:center;border-radius:${t.radius}px ${t.radius}px 0 0;background:#ff9473;background-image:linear-gradient(160deg,#ff9473 0%,#ecda98 40%,#a7fccd 75%,#a0b5eb 100%);">
<div style="font-size:56px;line-height:1;">🎂</div>
<h1 style="margin:20px 0 0;font-family:${t.headingFont};font-size:46px;font-weight:400;line-height:1.1;color:#242424;">${esc(v.headline)}</h1>
<p style="margin:10px 0 0;font-family:${t.headingFont};font-size:24px;font-style:italic;color:#242424;">${esc(v.name)}</p>
</div>
<div class="pad" style="padding:40px;text-align:center;">
${paras(v.message, t, 17)}
${v.giftUrl ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0"><tr><td>${button("Open your gift 🎁", v.giftUrl, t)}</td></tr></table>` : ""}
<p style="margin:20px 0 0;font-family:${t.headingFont};font-size:22px;font-style:italic;color:${t.text};">${esc(v.from)}</p>
</div>`,
      }),
  },

  {
    id: "invoice",
    name: "Invoice",
    category: "Billing",
    description: "A tidy invoice with line items and a pay button.",
    subject: "Invoice {{invoice}} from {{business}}",
    swatch: ["#f6f3f1", "#2b59d1"],
    theme: { headingFont: FONT_OPTIONS[0].value, radius: 12 },
    fields: [
      { key: "business", label: "Your business", type: "text", default: "Okafor Studio" },
      { key: "client", label: "Client name", type: "text", default: "Acme Corp." },
      { key: "invoice", label: "Invoice number", type: "text", default: "INV-2026-031" },
      { key: "issued", label: "Issue date", type: "text", default: "Oct 9, 2026" },
      { key: "due", label: "Due date", type: "text", default: "Oct 23, 2026" },
      { key: "items", label: "Line items", type: "list", default: "Brand strategy workshop | $2,400.00\nVisual identity system | $5,800.00\nWebsite design (12 pages) | $7,200.00", hint: "Description | Amount — one per line" },
      { key: "total", label: "Total due", type: "text", default: "$15,400.00" },
      { key: "payUrl", label: "Payment link", type: "url", default: "https://example.com/pay" },
      { key: "notes", label: "Notes", type: "textarea", default: "Thank you for your business. Payment is due within 14 days." },
    ],
    render: (v, t) => {
      const meta = (k: string, val: string) =>
        `<td class="stack" style="padding:0 0 12px;"><span style="${label(t)}">${k}</span><br>${esc(val)}</td>`;
      return shell(t, {
        title: `Invoice ${v.invoice}`,
        preheader: `${v.total} due ${v.due}`,
        inner: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="font-family:${t.font};font-size:20px;font-weight:600;color:${t.text};">${esc(v.business)}</td>
<td align="right" valign="top" style="${label(t)}line-height:1.7;">Invoice<br><span style="color:${t.text};font-size:14px;">${esc(v.invoice)}</span></td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;font-family:${t.font};font-size:14px;color:${t.text};"><tr>
${meta("Billed to", v.client)}${meta("Issued", v.issued)}${meta("Due", v.due)}
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${t.font};font-size:15px;color:${t.text};">
${rows(v.items)
  .map(([d, a]) => `<tr><td style="padding:14px 0;border-bottom:1px solid ${t.border};">${esc(d)}</td><td align="right" style="padding:14px 0;border-bottom:1px solid ${t.border};white-space:nowrap;">${esc(a || "")}</td></tr>`)
  .join("")}
<tr><td style="padding:18px 0;${label(t)}">Total due</td><td align="right" style="padding:18px 0;font-size:24px;">${esc(v.total)}</td></tr>
</table>
${button(`Pay ${v.total}`, v.payUrl, t)}
<p style="margin:20px 0 0;font-family:${t.font};font-size:14px;line-height:1.6;color:${t.muted};">${esc(v.notes)}</p>`,
        footer: `${esc(v.business)} · ${esc(v.invoice)}`,
      });
    },
  },

  {
    id: "letter",
    name: "Personal Letter",
    category: "Personal",
    description: "A quiet, serif letter. Just words, beautifully set.",
    subject: "A note for you",
    swatch: ["#fffdfa", "#4e4d4d"],
    theme: { surface: "#fffdfa", font: FONT_OPTIONS[2].value, radius: 4 },
    fields: [
      { key: "place", label: "Place & date", type: "text", default: "Lisbon, October 2026" },
      { key: "greeting", label: "Greeting", type: "text", default: "Dear Elena," },
      { key: "body", label: "Letter", type: "textarea", default: "I've been meaning to write since the summer. The city is quieter now, and the light in the afternoons is the color of old paper.\n\nI think about our long walks along the river more than I expected to. Come visit when you can. The spare room is yours.\n\nWrite back when you have a moment." },
      { key: "closing", label: "Closing", type: "text", default: "Warmly," },
      { key: "name", label: "Your name", type: "text", default: "Tomás" },
    ],
    render: (v, t) =>
      shell(t, {
        title: "A letter",
        preheader: v.greeting,
        pad: 56,
        inner: `<p style="margin:0 0 36px;font-family:${t.font};font-size:13px;font-style:italic;color:${t.muted};text-align:right;">${esc(v.place)}</p>
<p style="margin:0 0 24px;font-family:${t.headingFont};font-size:22px;color:${t.text};">${esc(v.greeting)}</p>
${paras(v.body, t, 17)}
<p style="margin:32px 0 4px;font-family:${t.font};font-size:17px;color:${t.text};">${esc(v.closing)}</p>
<p style="margin:0;font-family:${t.headingFont};font-size:28px;font-style:italic;color:${t.text};">${esc(v.name)}</p>`,
      }),
  },

  {
    id: "webinar",
    name: "Webinar Reminder",
    category: "Events",
    description: "A countdown-style reminder with speakers and a join link.",
    subject: "Starting soon: {{title}}",
    swatch: ["#2b59d1", "#cfdaf5"],
    theme: { bg: "#e9eefb" },
    fields: [
      { key: "brand", label: "Brand", type: "text", default: "Fieldnotes" },
      { key: "title", label: "Webinar title", type: "text", default: "Designing for trust in AI products" },
      { key: "when", label: "When", type: "text", default: "Thursday, Oct 16 · 11:00 AM PT" },
      { key: "duration", label: "Duration", type: "text", default: "45 minutes + Q&A" },
      { key: "speakers", label: "Speakers", type: "list", default: "Lena Park | Head of Design, Fieldnotes\nOmar Haddad | Research Lead, Atlas", hint: "Name | Role — one per line" },
      { key: "agenda", label: "What you'll learn", type: "list", default: "How users decide what to trust\nPatterns for explaining model output\nA live teardown of three products", hint: "One per line" },
      { key: "joinUrl", label: "Join link", type: "url", default: "https://example.com/join" },
    ],
    render: (v, t) =>
      shell(t, {
        title: v.title,
        preheader: `${v.when} · ${v.duration}`,
        inner: `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:6px 14px;border:1px solid ${t.border};border-radius:999px;${label(t)}">● Live · ${esc(v.brand)}</td></tr></table>
<div style="height:20px"></div>
${heading(v.title, t, 36)}
<p style="margin:0 0 28px;font-family:${t.font};font-size:15px;color:${t.muted};">${esc(v.when)} · ${esc(v.duration)}</p>
${eyebrow("Speakers", t)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
${rows(v.speakers)
  .map(
    ([n, r]) => `<tr><td width="52" style="padding:10px 0;"><div style="width:40px;height:40px;line-height:40px;border-radius:999px;background:#cfdaf5;text-align:center;font-family:${t.headingFont};font-size:18px;color:#242424;">${esc((n || "?").charAt(0))}</div></td><td style="padding:10px 0;font-family:${t.font};font-size:15px;color:${t.text};">${esc(n)}<br><span style="font-size:13px;color:${t.muted};">${esc(r || "")}</span></td></tr>`
  )
  .join("")}
</table>
${eyebrow("What you'll learn", t)}
${lines(v.agenda)
  .map((a) => `<p style="margin:0 0 10px;font-family:${t.font};font-size:15px;color:${t.text};">→ &nbsp;${esc(a)}</p>`)
  .join("")}
<div style="height:16px"></div>
${button("Join the webinar", v.joinUrl, t)}`,
        footer: `${esc(v.brand)} · Add to calendar from the join page.`,
      }),
  },
];

/* ---------- api ---------- */

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function defaultValues(tpl: Template): Record<string, string> {
  return Object.fromEntries(tpl.fields.map((f) => [f.key, f.default]));
}

export function resolveTheme(tpl: Template, overrides: Partial<Theme> = {}): Theme {
  return { ...BASE_THEME, ...tpl.theme, ...overrides };
}

export function renderTemplate(tpl: Template, values: Record<string, string> = {}, overrides: Partial<Theme> = {}): string {
  return tpl.render({ ...defaultValues(tpl), ...values }, resolveTheme(tpl, overrides));
}

export function fillSubject(tpl: Template, values: Record<string, string> = {}): string {
  const all = { ...defaultValues(tpl), ...values };
  return tpl.subject.replace(/\{\{(\w+)\}\}/g, (_, k: string) => all[k] ?? "");
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li|table)>/gi, "\n")
    .replace(/<a [^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const STARTER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; background:#f6f3f1; font-family: Georgia, serif; color:#242424; }
  .card { max-width:560px; margin:40px auto; background:#ffffff; border:1px solid #e4e0dd; border-radius:24px; padding:40px; }
  h1 { font-weight:400; font-size:36px; letter-spacing:-0.5px; margin:0 0 16px; }
  p { font-family: Helvetica, Arial, sans-serif; font-size:16px; line-height:1.6; color:#4e4d4d; }
  .btn { display:inline-block; background:#2b59d1; color:#ffffff !important; text-decoration:none;
         padding:14px 28px; border-radius:999px; font-family: Helvetica, Arial, sans-serif; font-size:14px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Hello from your own HTML.</h1>
    <p>Write any markup and CSS you like. The preview updates as you type.</p>
    <p><a class="btn" href="https://example.com">Call to action</a></p>
  </div>
</body>
</html>`;
