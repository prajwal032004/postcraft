"use client";

import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import CodeEditor from "./CodeEditor";
import TemplateThumb from "@/components/TemplateThumb";
import { SITE } from "@/lib/site";
import VideoShowcase from "@/components/VideoShowcase";
import {
  FONT_OPTIONS,
  STARTER_HTML,
  TEMPLATES,
  Theme,
  defaultValues,
  fillSubject,
  getTemplate,
  htmlToText,
  renderTemplate,
  resolveTheme,
} from "@/lib/templates";

/* ---------------- types & constants ---------------- */

type Mode = "template" | "html";
type LeftTab = "library" | "content" | "style";
type MobileTab = "edit" | "preview" | "send";
type Device = "desktop" | "mobile" | "text";

const DEVICES: [Device, string][] = [
  ["desktop", "Desktop"],
  ["mobile", "Mobile"],
  ["text", "Plain text"],
];

type ProviderId = "gmail" | "outlook" | "yahoo" | "zoho" | "icloud" | "custom";
const PROVIDERS: Record<ProviderId, { label: string; host: string; port: number; help?: string; note?: string }> = {
  gmail: { label: "Gmail", host: "smtp.gmail.com", port: 465, help: "https://myaccount.google.com/apppasswords", note: "Needs 2-Step Verification, then create an app password." },
  outlook: { label: "Outlook", host: "smtp-mail.outlook.com", port: 587, help: "https://account.live.com/proofs/AppPassword", note: "Some Microsoft accounts have SMTP sign-in turned off by their admin." },
  yahoo: { label: "Yahoo", host: "smtp.mail.yahoo.com", port: 465, help: "https://login.yahoo.com/account/security", note: "Generate an app password under Account security." },
  zoho: { label: "Zoho", host: "smtp.zoho.com", port: 465, help: "https://accounts.zoho.com/home#security/app_password", note: "Use smtp.zoho.eu or .in if your account lives in that region." },
  icloud: { label: "iCloud", host: "smtp.mail.me.com", port: 587, help: "https://account.apple.com", note: "Create an app-specific password in your Apple Account." },
  custom: { label: "Custom", host: "", port: 587 },
};

interface Draft {
  mode: Mode;
  templateId: string;
  values: Record<string, Record<string, string>>;
  themes: Record<string, Partial<Theme>>;
  html: string;
  subject: string;
  subjectTouched: boolean;
  to: string;
  cc: string;
  bcc: string;
  replyTo: string;
}

interface Creds {
  provider: ProviderId;
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
}

interface Attach {
  filename: string;
  content: string;
  contentType: string;
  size: number;
}

interface Toast {
  id: number;
  kind: "ok" | "err" | "info";
  text: string;
}

interface HistoryItem {
  at: number;
  subject: string;
  to: string;
}

const DRAFT_KEY = "postcraft:draft:v1";
const CREDS_KEY = "postcraft:creds:v1";
const HISTORY_KEY = "postcraft:history:v1";
const MAX_ATTACH = 3_000_000;

const store = {
  get<T>(k: string): T | null {
    try {
      const s = window.localStorage.getItem(k);
      return s ? (JSON.parse(s) as T) : null;
    } catch {
      return null;
    }
  },
  set(k: string, v: unknown) {
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage unavailable */
    }
  },
  del(k: string) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const emptyDraft: Draft = {
  mode: "template",
  templateId: TEMPLATES[0].id,
  values: {},
  themes: {},
  html: STARTER_HTML,
  subject: "",
  subjectTouched: false,
  to: "",
  cc: "",
  bcc: "",
  replyTo: "",
};

const emptyCreds: Creds = { provider: "gmail", host: PROVIDERS.gmail.host, port: 465, user: "", pass: "", fromName: "" };

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function titleOf(html: string) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
}

/* ---------------- component ---------------- */

export default function Composer() {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [creds, setCreds] = useState<Creds>(emptyCreds);
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [attachments, setAttachments] = useState<Attach[]>([]);
  const [leftTab, setLeftTab] = useState<LeftTab>("library");
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [device, setDevice] = useState<Device>("desktop");
  const [busy, setBusy] = useState<"" | "send" | "verify">("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState("All");
  const shellRef = useRef<HTMLDivElement>(null);
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const htmlFileRef = useRef<HTMLInputElement>(null);

  const tpl = getTemplate(draft.templateId);
  const values = useMemo(() => ({ ...defaultValues(tpl), ...(draft.values[tpl.id] || {}) }), [tpl, draft.values]);
  const themeOverrides = draft.themes[tpl.id] || {};
  const theme = resolveTheme(tpl, themeOverrides);

  /* ---------- hydrate from storage + URL ---------- */
  useEffect(() => {
    const saved = store.get<Draft>(DRAFT_KEY);
    const next: Draft = { ...emptyDraft, ...(saved || {}) };
    const params = new URLSearchParams(window.location.search);
    const t = params.get("template");
    if (t && TEMPLATES.some((x) => x.id === t)) {
      next.templateId = t;
      next.mode = "template";
      next.subjectTouched = false;
      setLeftTab("content");
    }
    if (params.get("mode") === "html") next.mode = "html";
    setDraft(next);
    if (next.cc || next.bcc) setShowCc(true);

    const c = store.get<Creds>(CREDS_KEY);
    if (c) {
      setCreds({ ...emptyCreds, ...c });
      setRemember(true);
    }
    setHistory(store.get<HistoryItem[]>(HISTORY_KEY) || []);
    setHydrated(true);
  }, []);

  /* ---------- persist ---------- */
  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => store.set(DRAFT_KEY, draft), 400);
    return () => clearTimeout(id);
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (remember) store.set(CREDS_KEY, creds);
    else store.del(CREDS_KEY);
  }, [creds, remember, hydrated]);

  /* ---------- derived output ---------- */
  const compiled = useMemo(() => {
    if (draft.mode === "html") return draft.html;
    return renderTemplate(tpl, values, themeOverrides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.mode, draft.html, tpl, values, JSON.stringify(themeOverrides)]);
  const previewHtml = useDeferredValue(compiled);

  const autoSubject = draft.mode === "template" ? fillSubject(tpl, values) : titleOf(draft.html);
  const subject = draft.subjectTouched ? draft.subject : autoSubject;
  const plainText = useMemo(() => htmlToText(compiled), [compiled]);
  const preheader = useMemo(() => plainText.replace(/\s+/g, " ").slice(0, 110), [plainText]);

  /* ---------- intro animation ---------- */
  useLayoutEffect(() => {
    if (!hydrated) return;
    const ctx = gsap.context(() => {
      gsap.from(".cmp-top > *", { y: -16, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 });
      gsap.from(".cmp-panel, .cmp-preview", { y: 32, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.1 });
    }, shellRef);
    return () => ctx.revert();
  }, [hydrated]);

  // soft crossfade when the template or mode changes
  useEffect(() => {
    if (!hydrated || !frameWrapRef.current) return;
    gsap.fromTo(frameWrapRef.current, { opacity: 0.2, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" });
  }, [draft.templateId, draft.mode, hydrated]);

  /* ---------- helpers ---------- */
  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "err" ? 7000 : 4000);
  }, []);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const setValue = (key: string, v: string) =>
    setDraft((d) => ({ ...d, values: { ...d.values, [tpl.id]: { ...(d.values[tpl.id] || {}), [key]: v } } }));

  const setThemeKey = <K extends keyof Theme>(key: K, v: Theme[K]) =>
    setDraft((d) => ({ ...d, themes: { ...d.themes, [tpl.id]: { ...(d.themes[tpl.id] || {}), [key]: v } } }));

  const pickTemplate = (id: string) => {
    patch({ templateId: id, mode: "template", subjectTouched: false });
    setLeftTab("content");
  };

  const resetContent = () => setDraft((d) => ({ ...d, values: { ...d.values, [tpl.id]: {} } }));
  const resetStyle = () => setDraft((d) => ({ ...d, themes: { ...d.themes, [tpl.id]: {} } }));

  const toHtmlMode = () => {
    patch({ mode: "html", html: compiled, subject, subjectTouched: true });
    toast("info", "Template copied into the HTML editor. Edit anything you like.");
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(compiled);
      toast("ok", "HTML copied to clipboard.");
    } catch {
      toast("err", "Clipboard access was blocked by the browser.");
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([compiled], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(subject || "email").replace(/[^\w-]+/g, "-").toLowerCase().slice(0, 60) || "email"}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const importHtml = (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) return toast("err", "That file is larger than 2 MB.");
    const r = new FileReader();
    r.onload = () => {
      patch({ mode: "html", html: String(r.result || "") });
      toast("ok", `Imported ${f.name}.`);
    };
    r.readAsText(f);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const current = attachments.reduce((n, a) => n + a.size, 0);
    const incoming = files.reduce((n, f) => n + f.size, 0);
    if (current + incoming > MAX_ATTACH) {
      toast("err", `Attachments are limited to ${fmtBytes(MAX_ATTACH)} in total.`);
      return;
    }
    files.forEach((f) => {
      const r = new FileReader();
      r.onload = () => {
        const data = String(r.result || "");
        const content = data.slice(data.indexOf(",") + 1);
        setAttachments((a) => [...a, { filename: f.name, content, contentType: f.type || "application/octet-stream", size: f.size }]);
      };
      r.readAsDataURL(f);
    });
  };

  const setProvider = (p: ProviderId) => {
    const preset = PROVIDERS[p];
    setCreds((c) => ({ ...c, provider: p, host: p === "custom" ? c.host : preset.host, port: p === "custom" ? c.port : preset.port }));
  };

  const credsReady = creds.user.trim() && creds.pass.trim() && creds.host.trim() && creds.port;

  const call = async (action: "send" | "verify", toOverride?: string) => {
    if (!credsReady) {
      toast("err", "Add your email, app password and SMTP server first.");
      setMobileTab("send");
      return;
    }
    const to = (toOverride ?? draft.to).trim();
    if (action === "send") {
      if (!to) return toast("err", "Add at least one recipient.");
      if (!subject.trim()) return toast("err", "Add a subject line.");
    }
    setBusy(action);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          smtp: { host: creds.host, port: Number(creds.port), user: creds.user, pass: creds.pass },
          fromName: creds.fromName,
          to,
          cc: toOverride ? "" : showCc ? draft.cc : "",
          bcc: toOverride ? "" : showCc ? draft.bcc : "",
          replyTo: draft.replyTo,
          subject,
          html: compiled,
          text: plainText,
          attachments: attachments.map(({ filename, content, contentType }) => ({ filename, content, contentType })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status}).`);
      toast("ok", data.message || "Done.");
      if (action === "send") {
        const item = { at: Date.now(), subject, to };
        const next = [item, ...history].slice(0, 8);
        setHistory(next);
        store.set(HISTORY_KEY, next);
        gsap.fromTo(".send-btn", { scale: 0.94 }, { scale: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      }
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  // Ctrl/Cmd + Enter sends. callRef keeps the handler current without rebinding.
  const callRef = useRef(call);
  callRef.current = call;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void callRef.current("send");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const categories = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];
  const shownTemplates = filter === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === filter);
  const totalAttach = attachments.reduce((n, a) => n + a.size, 0);

  /* ---------------- render ---------------- */
  return (
    <div className="cmp" ref={shellRef} data-mobile={mobileTab}>
      <header className="cmp-top">
        <Link href="/" className="logo" aria-label="Back to home">
          <span className="logo-mark" />
          <span className="cmp-logo-text">{SITE.wordmark}</span>
        </Link>

        <div className="seg" role="tablist" aria-label="Compose mode">
          <button role="tab" aria-selected={draft.mode === "template"} className={draft.mode === "template" ? "on" : ""} onClick={() => patch({ mode: "template" })}>
            Template
          </button>
          <button role="tab" aria-selected={draft.mode === "html"} className={draft.mode === "html" ? "on" : ""} onClick={() => patch({ mode: "html" })}>
            HTML / CSS
          </button>
          <span className="seg-thumb" style={{ transform: `translateX(${draft.mode === "html" ? 100 : 0}%)` }} />
        </div>

        <div className="cmp-top-actions">
          <button className="btn btn-blue btn-sm send-btn" onClick={() => call("send")} disabled={busy !== ""}>
            {busy === "send" ? "Sending…" : "Send"} <span className="arrow">▸</span>
          </button>
        </div>
      </header>

      <nav className="cmp-mtabs" aria-label="Sections">
        {(["edit", "preview", "send"] as MobileTab[]).map((t) => (
          <button key={t} className={mobileTab === t ? "on" : ""} onClick={() => setMobileTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      <div className="cmp-body">
        {/* ================= LEFT: editor ================= */}
        <section className="cmp-panel cmp-left" aria-label="Editor">
          {draft.mode === "template" ? (
            <>
              <div className="tabs" role="tablist">
                {(["library", "content", "style"] as LeftTab[]).map((t) => (
                  <button key={t} role="tab" aria-selected={leftTab === t} className={leftTab === t ? "on" : ""} onClick={() => setLeftTab(t)}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="panel-scroll" data-lenis-prevent>
                {leftTab === "library" && (
                  <div className="lib">
                    <div className="chips">
                      {categories.map((c) => (
                        <button key={c} className={`chip${filter === c ? " on" : ""}`} onClick={() => setFilter(c)}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="lib-grid">
                      {shownTemplates.map((t, i) => (
                        <button
                          key={t.id}
                          className={`lib-card${t.id === tpl.id ? " on" : ""}`}
                          onClick={() => pickTemplate(t.id)}
                          title={t.description}
                          aria-pressed={t.id === tpl.id}
                        >
                          <TemplateThumb tpl={t} ratio={1.3} eager={i < 4} />
                          <span className="lib-meta">
                            <small>{t.category}</small>
                            <strong>{t.name}</strong>
                          </span>
                          {t.id === tpl.id && <span className="lib-badge">In use</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {leftTab === "content" && (
                  <div className="form">
                    <div className="form-head">
                      <div>
                        <small className="muted">{tpl.category}</small>
                        <h2 className="h-sub">{tpl.name}</h2>
                      </div>
                      <button className="link-arrow" onClick={resetContent}>
                        Reset
                      </button>
                    </div>
                    {tpl.fields.map((f) => (
                      <label key={f.key} className="field">
                        <span className="field-label">{f.label}</span>
                        {f.type === "textarea" || f.type === "list" ? (
                          <textarea
                            className={`input${f.type === "list" ? " mono-sm" : ""}`}
                            rows={f.type === "list" ? 4 : 5}
                            value={values[f.key] ?? ""}
                            onChange={(e) => setValue(f.key, e.target.value)}
                          />
                        ) : (
                          <input
                            className="input"
                            type={f.type === "url" ? "url" : "text"}
                            value={values[f.key] ?? ""}
                            placeholder={f.type === "url" ? "https://" : ""}
                            onChange={(e) => setValue(f.key, e.target.value)}
                          />
                        )}
                        {f.hint && <span className="field-hint">{f.hint}</span>}
                      </label>
                    ))}
                    <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8 }} onClick={toHtmlMode}>
                      Edit this template as HTML
                    </button>
                  </div>
                )}

                {leftTab === "style" && (
                  <div className="form">
                    <div className="form-head">
                      <div>
                        <small className="muted">Custom CSS</small>
                        <h2 className="h-sub">Style</h2>
                      </div>
                      <button className="link-arrow" onClick={resetStyle}>
                        Reset
                      </button>
                    </div>
                    <div className="colors">
                      {(
                        [
                          ["accent", "Accent"],
                          ["accentText", "Button text"],
                          ["bg", "Background"],
                          ["surface", "Card"],
                          ["text", "Text"],
                          ["muted", "Muted text"],
                          ["border", "Borders"],
                        ] as [keyof Theme, string][]
                      ).map(([k, lbl]) => (
                        <label key={k} className="color">
                          <input type="color" value={String(theme[k])} onChange={(e) => setThemeKey(k, e.target.value as never)} />
                          <span>
                            <span className="field-label">{lbl}</span>
                            <code>{String(theme[k])}</code>
                          </span>
                        </label>
                      ))}
                    </div>
                    <label className="field">
                      <span className="field-label">Body font</span>
                      <select className="input" value={theme.font} onChange={(e) => setThemeKey("font", e.target.value)}>
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.label} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">Heading font</span>
                      <select className="input" value={theme.headingFont} onChange={(e) => setThemeKey("headingFont", e.target.value)}>
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.label} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">
                        Corner radius <code>{theme.radius}px</code>
                      </span>
                      <input type="range" min={0} max={40} value={theme.radius} onChange={(e) => setThemeKey("radius", Number(e.target.value))} />
                    </label>
                    <div className="field">
                      <span className="field-label">Extra CSS</span>
                      <CodeEditor
                        value={theme.extraCss}
                        onChange={(v) => setThemeKey("extraCss", v)}
                        placeholder={"/* Injected into <style> */\nh1 { letter-spacing: -1px; }\na { text-decoration: none; }"}
                        minHeight={180}
                        ariaLabel="Extra CSS"
                      />
                      <span className="field-hint">Applied inside the email&apos;s &lt;style&gt; tag. Inline styles win, so use !important to override.</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="tabs tabs-tools">
                <span className="tabs-title">index.html</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="chip" onClick={() => patch({ html: STARTER_HTML })}>
                    Starter
                  </button>
                  <button className="chip" onClick={() => htmlFileRef.current?.click()}>
                    Import
                  </button>
                  <button className="chip" onClick={() => patch({ html: "" })}>
                    Clear
                  </button>
                </div>
                <input ref={htmlFileRef} type="file" accept=".html,.htm,text/html" hidden onChange={(e) => importHtml(e.target.files?.[0])} />
              </div>
              <div className="panel-code" data-lenis-prevent>
                <CodeEditor value={draft.html} onChange={(v) => patch({ html: v })} placeholder="<!-- Paste or write your email HTML here -->" ariaLabel="Email HTML" />
              </div>
              <div className="panel-foot">
                <span>{draft.html.split("\n").length} lines</span>
                <span>{fmtBytes(new Blob([draft.html]).size)}</span>
              </div>
            </>
          )}
        </section>

        {/* ================= CENTER: preview ================= */}
        <section className="cmp-preview" aria-label="Preview">
          <div className="preview-bar">
            <div className="seg seg-sm" style={{ "--seg-n": DEVICES.length } as React.CSSProperties}>
              {DEVICES.map(([id, label]) => (
                <button key={id} className={device === id ? "on" : ""} aria-pressed={device === id} onClick={() => setDevice(id)}>
                  {label}
                </button>
              ))}
              <span
                className="seg-thumb"
                style={{ transform: `translateX(${DEVICES.findIndex(([id]) => id === device) * 100}%)` }}
              />
            </div>
            <div className="preview-actions">
              <span className="muted preview-note">Ctrl + Enter to send</span>
              <button className="chip" onClick={copyHtml}>
                Copy HTML
              </button>
              <button className="chip" onClick={downloadHtml}>
                Download
              </button>
            </div>
          </div>

          <div className="inbox-row">
            <span className="avatar">{(creds.fromName || creds.user || "Y").charAt(0).toUpperCase()}</span>
            <div className="inbox-text">
              <div className="inbox-line1">
                <strong>{creds.fromName || creds.user || "Your name"}</strong>
                <span className="muted">now</span>
              </div>
              <div className="inbox-subject">{subject || "(no subject)"}</div>
              <div className="inbox-pre muted">{preheader}</div>
            </div>
          </div>

          <div className="frame-stage" data-lenis-prevent>
            <div ref={frameWrapRef} className={`frame ${device}`}>
              {device === "text" ? (
                <div className="text-view" data-lenis-prevent>
                  <small className="muted">text/plain alternative — what clients without HTML will show</small>
                  <pre>{plainText}</pre>
                </div>
              ) : (
                <iframe title="Email preview" srcDoc={previewHtml} sandbox="allow-same-origin" />
              )}
            </div>
          </div>
        </section>

        {/* ================= RIGHT: send ================= */}
        <aside className="cmp-panel cmp-right" aria-label="Send settings">
          <div className="panel-scroll" data-lenis-prevent>
            <div className="form">
              <div className="form-head">
                <div>
                  <small className="muted">Step 1</small>
                  <h2 className="h-sub">Your account</h2>
                </div>
              </div>

              <div className="chips">
                {(Object.keys(PROVIDERS) as ProviderId[]).map((p) => (
                  <button key={p} className={`chip${creds.provider === p ? " on" : ""}`} onClick={() => setProvider(p)}>
                    {PROVIDERS[p].label}
                  </button>
                ))}
              </div>

              <label className="field">
                <span className="field-label">Email address</span>
                <input className="input" type="email" autoComplete="email" placeholder="you@gmail.com" value={creds.user} onChange={(e) => setCreds({ ...creds, user: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">App password</span>
                <span className="input-wrap">
                  <input
                    className="input"
                    type={showPass ? "text" : "password"}
                    autoComplete="off"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={creds.pass}
                    onChange={(e) => setCreds({ ...creds, pass: e.target.value })}
                  />
                  <button type="button" className="input-btn" onClick={() => setShowPass((s) => !s)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </span>
                {PROVIDERS[creds.provider].note && (
                  <span className="field-hint">
                    {PROVIDERS[creds.provider].note}{" "}
                    {PROVIDERS[creds.provider].help && (
                      <a href={PROVIDERS[creds.provider].help} target="_blank" rel="noreferrer" className="u">
                        Get one →
                      </a>
                    )}
                    {creds.provider === "gmail" && (
                      <>
                        {" · "}
                        <button type="button" className="field-link" onClick={() => setShowHelp(true)}>
                          Watch 25s setup
                        </button>
                      </>
                    )}
                  </span>
                )}
              </label>
              <label className="field">
                <span className="field-label">Sender name</span>
                <input className="input" placeholder="Jane from Northwind" value={creds.fromName} onChange={(e) => setCreds({ ...creds, fromName: e.target.value })} />
              </label>

              <div className="row2">
                <label className="field">
                  <span className="field-label">SMTP host</span>
                  <input className="input" value={creds.host} placeholder="smtp.example.com" onChange={(e) => setCreds({ ...creds, host: e.target.value, provider: "custom" })} />
                </label>
                <label className="field" style={{ maxWidth: 100 }}>
                  <span className="field-label">Port</span>
                  <input className="input" inputMode="numeric" value={creds.port} onChange={(e) => setCreds({ ...creds, port: Number(e.target.value.replace(/\D/g, "")) || 0, provider: "custom" })} />
                </label>
              </div>

              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Remember on this device only</span>
              </label>

              <div className="btn-row">
                <button className="btn btn-ghost btn-sm" onClick={() => call("verify")} disabled={busy !== ""}>
                  {busy === "verify" ? "Checking…" : "Test connection"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => call("send", creds.user)}
                  disabled={busy !== "" || !creds.user.trim()}
                  title="Send this draft to your own address"
                >
                  Send me a test
                </button>
              </div>

              <hr className="rule" style={{ margin: "12px 0" }} />

              <div className="form-head">
                <div>
                  <small className="muted">Step 2</small>
                  <h2 className="h-sub">Message</h2>
                </div>
                <button className="link-arrow" onClick={() => setShowCc((s) => !s)}>
                  {showCc ? "Hide CC" : "CC / BCC"}
                </button>
              </div>

              <label className="field">
                <span className="field-label">To</span>
                <input className="input" placeholder="prajwal@example.com, sam@example.com" value={draft.to} onChange={(e) => patch({ to: e.target.value })} />
              </label>
              {showCc && (
                <>
                  <label className="field">
                    <span className="field-label">CC</span>
                    <input className="input" value={draft.cc} onChange={(e) => patch({ cc: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="field-label">BCC</span>
                    <input className="input" value={draft.bcc} onChange={(e) => patch({ bcc: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="field-label">Reply-to</span>
                    <input className="input" type="email" value={draft.replyTo} onChange={(e) => patch({ replyTo: e.target.value })} />
                  </label>
                </>
              )}
              <label className="field">
                <span className="field-label">
                  Subject
                  {draft.subjectTouched && draft.mode === "template" && (
                    <button className="field-link" onClick={() => patch({ subjectTouched: false })}>
                      Auto
                    </button>
                  )}
                </span>
                <input className="input" value={subject} onChange={(e) => patch({ subject: e.target.value, subjectTouched: true })} />
              </label>

              <div className="field">
                <span className="field-label">
                  Attachments <code>{fmtBytes(totalAttach)} / 3 MB</code>
                </span>
                <button
                  className="drop"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addFiles(e.dataTransfer.files);
                  }}
                >
                  Drop files or click to attach
                </button>
                <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                {attachments.map((a, i) => (
                  <div key={i} className="att">
                    <span>⎙ {a.filename}</span>
                    <span className="muted">{fmtBytes(a.size)}</span>
                    <button aria-label={`Remove ${a.filename}`} onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))}>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button className="btn btn-blue send-btn" style={{ width: "100%" }} onClick={() => call("send")} disabled={busy !== ""}>
                {busy === "send" ? "Sending…" : "Send email"} <span className="arrow">▸</span>
              </button>
              <p className="field-hint" style={{ textAlign: "center" }}>
                Your app password is used for this send only and never stored on our servers.
              </p>

              {history.length > 0 && (
                <div className="history">
                  <span className="field-label">Recently sent</span>
                  {history.map((h, i) => (
                    <div key={i} className="history-row">
                      <span className="history-subj">{h.subject}</span>
                      <span className="muted">
                        {h.to.split(",")[0]}
                        {h.to.includes(",") ? " +" : ""} · {new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="cmp-by">
                {SITE.name} · Made by <strong>{SITE.author}</strong>
              </p>
            </div>
          </div>
        </aside>
      </div>

      {showHelp && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Creating a Gmail app password">
          <button className="modal-scrim" aria-label="Close" onClick={() => setShowHelp(false)} />
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <small className="muted">Gmail · 25 seconds</small>
                <h2 className="h-sub">Create an app password</h2>
              </div>
              <button className="modal-x" onClick={() => setShowHelp(false)} aria-label="Close">
                ×
              </button>
            </div>
            <VideoShowcase />
            <ol className="modal-steps">
              <li>Turn on 2-Step Verification in your Google Account.</li>
              <li>Open myaccount.google.com/apppasswords and name it “{SITE.name}”.</li>
              <li>Paste the 16-character code into the App password field.</li>
            </ol>
          </div>
        </div>
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span className="toast-dot" />
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
