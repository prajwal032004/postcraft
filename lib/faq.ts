/**
 * FAQ copy as plain data so the rendered accordion and the FAQPage JSON-LD
 * can never say different things.
 */

export interface FaqItem {
  q: string;
  /** Paragraphs of the answer. */
  a: string[];
  /** Optional ordered list rendered after the paragraphs. */
  steps?: string[];
}

export const FAQ: FaqItem[] = [
  {
    q: "What is an app password, and where do I get one?",
    a: [
      "An app password is a 16-character code your email provider issues so a third-party app can send mail without your real password. For Gmail:",
    ],
    steps: [
      "Turn on 2-Step Verification in your Google Account.",
      "Open myaccount.google.com/apppasswords.",
      "Name it “Postcraft Plum”, create it, and paste the code into the composer.",
    ],
  },
  {
    q: "Is my password stored anywhere?",
    a: [
      "No. Your credentials go straight from your browser to a serverless function that opens one SMTP connection, sends your message and closes. Nothing is logged or saved on the server. You can optionally remember them on your own device only.",
    ],
  },
  {
    q: "Will my custom CSS survive Gmail and Outlook?",
    a: [
      "The built-in templates use table layouts and inline styles, the same techniques professional email teams use. In the HTML editor you can write any CSS, but email clients strip some features, so inline styles and tables are the safest bet.",
    ],
  },
  {
    q: "Can I send to several people at once?",
    a: ["Yes. Add up to 50 addresses across To, CC and BCC. Use BCC when recipients shouldn’t see each other."],
  },
  {
    q: "Which email providers work with Postcraft Plum?",
    a: [
      "Gmail, Outlook, Yahoo, Zoho, iCloud and Fastmail have one-click presets. Any other service that offers SMTP works through the custom host and port fields, including Amazon SES and your own mail server.",
    ],
  },
  {
    q: "Does Postcraft Plum track opens or clicks?",
    a: [
      "No. There are no tracking pixels, no link rewriting and no analytics inside the email. What you compose is exactly what your recipient receives.",
    ],
  },
  {
    q: "Is Postcraft Plum free?",
    a: [
      "Yes. There is no account, no subscription and no sending quota of our own. You are only ever limited by whatever your own email provider allows.",
    ],
  },
];

/** Flattened answer text, used for the FAQPage structured data. */
export const faqAnswerText = (item: FaqItem) =>
  [...item.a, ...(item.steps ?? []).map((s, i) => `${i + 1}. ${s}`)].join(" ");
