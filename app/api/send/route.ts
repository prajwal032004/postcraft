import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Credentials are used only for the lifetime of this request.
// Nothing is logged or stored on the server.

const MAX_RECIPIENTS = 50;
const MAX_HTML_BYTES = 2_000_000;
const MAX_ATTACH_BYTES = 3_000_000;
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;

interface Attachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

interface Payload {
  action?: "send" | "verify";
  smtp: { host: string; port: number; secure?: boolean; user: string; pass: string };
  fromName?: string;
  replyTo?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
}

function parseList(s?: string): string[] {
  return String(s || "")
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function friendlyError(err: unknown): string {
  const e = err as { code?: string; responseCode?: number; message?: string };
  if (e.code === "EAUTH" || e.responseCode === 535 || e.responseCode === 534)
    return "Authentication failed. Check your email and app password. Gmail and Yahoo need 2-step verification turned on and an app password, not your normal password.";
  if (e.code === "ECONNECTION" || e.code === "ETIMEDOUT" || e.code === "ESOCKET")
    return "Could not reach the mail server. Check the SMTP host and port.";
  if (e.code === "EENVELOPE") return "One or more recipient addresses were rejected.";
  if (e.code === "EDNS") return "The SMTP host name could not be resolved.";
  return e.message ? `Mail server error: ${e.message}` : "Unknown error while sending.";
}

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return bad("Invalid request body.");
  }

  const smtp = body.smtp;
  if (!smtp?.host || !smtp?.port || !smtp?.user || !smtp?.pass)
    return bad("SMTP host, port, email and app password are required.");
  if (!EMAIL_RE.test(smtp.user)) return bad("Your sender email address looks invalid.");

  const port = Number(smtp.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return bad("Invalid SMTP port.");

  const transporter = nodemailer.createTransport({
    host: smtp.host.trim(),
    port,
    secure: smtp.secure ?? port === 465,
    auth: { user: smtp.user.trim(), pass: smtp.pass.replace(/\s+/g, "") },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  try {
    if (body.action === "verify") {
      await transporter.verify();
      return NextResponse.json({ ok: true, message: "Connection verified. You're ready to send." });
    }

    const to = parseList(body.to);
    const cc = parseList(body.cc);
    const bcc = parseList(body.bcc);
    const all = [...to, ...cc, ...bcc];

    if (to.length === 0) return bad("Add at least one recipient.");
    if (all.length > MAX_RECIPIENTS) return bad(`You can send to at most ${MAX_RECIPIENTS} recipients at once.`);
    const invalid = all.filter((a) => !EMAIL_RE.test(a));
    if (invalid.length) return bad(`Invalid address: ${invalid.slice(0, 3).join(", ")}`);
    if (!body.subject?.trim()) return bad("Subject is required.");
    if (!body.html?.trim()) return bad("The email body is empty.");
    if (Buffer.byteLength(body.html) > MAX_HTML_BYTES) return bad("The HTML is too large (max 2 MB).");

    const attachments = (body.attachments || []).slice(0, 10);
    const attachBytes = attachments.reduce((n, a) => n + Math.floor((a.content?.length || 0) * 0.75), 0);
    if (attachBytes > MAX_ATTACH_BYTES) return bad("Attachments are too large (max 3 MB total).");

    const fromName = (body.fromName || "").replace(/["\r\n<>]/g, "").trim();
    const info = await transporter.sendMail({
      from: fromName ? { name: fromName, address: smtp.user.trim() } : smtp.user.trim(),
      to,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      replyTo: body.replyTo && EMAIL_RE.test(body.replyTo) ? body.replyTo : undefined,
      subject: body.subject.replace(/[\r\n]+/g, " ").slice(0, 300),
      html: body.html,
      text: body.text || undefined,
      attachments: attachments.map((a) => ({
        filename: String(a.filename || "attachment").slice(0, 120),
        content: a.content,
        encoding: "base64",
        contentType: a.contentType,
      })),
    });

    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      message: `Sent to ${(info.accepted as unknown[]).length} recipient(s).`,
    });
  } catch (err) {
    return bad(friendlyError(err), 502);
  } finally {
    transporter.close();
  }
}
