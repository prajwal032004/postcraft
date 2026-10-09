"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { initSmoothScroll } from "@/lib/smoothScroll";
import { TEMPLATES } from "@/lib/templates";
import Nav from "./Nav";
import Preloader from "./Preloader";
import Cursor from "./Cursor";
import TemplateCard from "./TemplateCard";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });
const CtaScene = dynamic(() => import("./CtaScene"), { ssr: false });

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const PROVIDERS = ["Gmail", "Outlook", "Yahoo Mail", "Zoho Mail", "iCloud Mail", "Fastmail", "Amazon SES", "Any SMTP"];

const STEPS: [string, string, string][] = [
  [
    "01",
    "Choose a starting point",
    "Pick a template and fill in the blanks, or open the HTML editor and write every line yourself.",
  ],
  [
    "02",
    "Style it your way",
    "Change colors, fonts and corner radius, or add your own CSS. The preview updates as you type.",
  ],
  [
    "03",
    "Send from your inbox",
    "Enter your email and an app password. Your message leaves from your account, so replies come back to you.",
  ],
];

const NUMBERS: [number, string, string, string][] = [
  [14, "", "Templates", "Hand-set, table-based and tested in real clients."],
  [50, "", "Recipients", "Per send, across To, CC and BCC."],
  [3, " MB", "Attachments", "Dropped straight into the message."],
  [0, "", "Stored secrets", "Your app password never touches our disk."],
];

const FEATURES: [string, string, string][] = [
  [
    "‹/›",
    "Raw HTML editor",
    "Paste, import or write HTML with line numbers and tab indenting. Turn any template into editable code in one click.",
  ],
  ["✎", "Custom CSS", "Change accent, background, text color, fonts and radius, or inject your own stylesheet into any template."],
  [
    "⚿",
    "Your credentials stay yours",
    "App passwords are used for one SMTP session and never stored on the server. Remembering them locally is opt-in.",
  ],
  ["⎙", "Attachments & BCC", "Attach files up to 3 MB and send to as many as 50 recipients across To, CC and BCC."],
];

const FAQ = [
  {
    q: "What is an app password, and where do I get one?",
    a: (
      <>
        An app password is a 16-character code your email provider issues so a third-party app can send mail without your real
        password. For Gmail:
        <ol>
          <li>Turn on 2-Step Verification in your Google Account.</li>
          <li>Open myaccount.google.com/apppasswords.</li>
          <li>Name it “Postcraft”, create it, and paste the code into the composer.</li>
        </ol>
      </>
    ),
  },
  {
    q: "Is my password stored anywhere?",
    a: (
      <>
        No. Your credentials go straight from your browser to a serverless function that opens one SMTP connection, sends your
        message and closes. Nothing is logged or saved on the server. You can optionally remember them on your own device only.
      </>
    ),
  },
  {
    q: "Will my custom CSS survive Gmail and Outlook?",
    a: (
      <>
        The built-in templates use table layouts and inline styles, the same techniques professional email teams use. In the HTML
        editor you can write any CSS, but email clients strip some features, so inline styles and tables are the safest bet.
      </>
    ),
  },
  {
    q: "Can I send to several people at once?",
    a: <>Yes. Add up to 50 addresses across To, CC and BCC. Use BCC when recipients shouldn’t see each other.</>,
  },
  {
    q: "Which providers work?",
    a: (
      <>
        Gmail, Yahoo, Zoho, iCloud and Fastmail have presets. Any other service that offers SMTP works through the custom host
        and port fields.
      </>
    ),
  },
  {
    q: "Does Postcraft track opens or clicks?",
    a: (
      <>
        No. There are no tracking pixels, no link rewriting and no analytics inside the email. What you compose is exactly what
        your recipient receives.
      </>
    ),
  },
];

const STATEMENT =
  "Most email looks like it was assembled by a committee. Yours can read like it was typeset — calm, deliberate, and entirely your own.";

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const pipeRef = useRef<HTMLDivElement>(null);
  const heroProgress = useRef(0);
  const readyRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [paths, setPaths] = useState<string[]>([]);

  const onIntroDone = useCallback(() => {
    readyRef.current = true;
    setReady(true);
  }, []);

  /* ---------- Lenis, wired into GSAP's ticker ---------- */
  useEffect(() => {
    return initSmoothScroll(({ scroll, progress: p }) => {
      setScrolled(scroll > 40);
      setProgress(Number.isFinite(p) ? p : 0);
    });
  }, []);

  /* ---------- pipeline connector geometry ---------- */
  useEffect(() => {
    const el = pipeRef.current;
    if (!el) return;
    const compute = () => {
      const hub = el.querySelector(".pipeline-hub") as HTMLElement | null;
      if (!hub || getComputedStyle(el).getPropertyValue("--pipe-lines").trim() === "off") {
        setPaths([]);
        return;
      }
      const box = el.getBoundingClientRect();
      const h = hub.getBoundingClientRect();
      const hx1 = h.left - box.left;
      const hx2 = h.right - box.left;
      const hy = h.top - box.top + h.height / 2;
      const out: string[] = [];
      el.querySelectorAll<HTMLElement>(".pipeline-col.left .pill").forEach((p) => {
        const r = p.getBoundingClientRect();
        const x = r.right - box.left;
        const y = r.top - box.top + r.height / 2;
        const mx = (x + hx1) / 2;
        out.push(`M${x},${y} C${mx},${y} ${mx},${hy} ${hx1},${hy}`);
      });
      el.querySelectorAll<HTMLElement>(".pipeline-col.right .pill").forEach((p) => {
        const r = p.getBoundingClientRect();
        const x = r.left - box.left;
        const y = r.top - box.top + r.height / 2;
        const mx = (x + hx2) / 2;
        out.push(`M${hx2},${hy} C${mx},${hy} ${mx},${y} ${x},${y}`);
      });
      setPaths(out);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------- draw the connectors once they exist ---------- */
  useEffect(() => {
    const pipe = pipeRef.current;
    if (!pipe || !paths.length || prefersReducedMotion()) return;
    // Scoped to the pipeline, but the trigger is the scope element itself,
    // so it has to be passed as a node rather than a selector string.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pipeline-svg .wire",
        { drawSVG: "0% 0%" },
        {
          drawSVG: "0% 100%",
          duration: 1.4,
          ease: "craft",
          stagger: 0.08,
          scrollTrigger: { trigger: pipe, start: "top 72%", once: true },
        }
      );
      gsap.fromTo(
        ".pipeline-svg .flow",
        { opacity: 0 },
        { opacity: 1, duration: 0.8, delay: 0.9, scrollTrigger: { trigger: pipe, start: "top 72%", once: true } }
      );
    }, pipeRef);
    return () => ctx.revert();
  }, [paths]);

  /* ---------- hero intro, held back until the curtain lifts ---------- */
  useEffect(() => {
    if (!ready) return;
    const reduced = prefersReducedMotion();
    let split: SplitText | null = null;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "craft" } });

      if (reduced) {
        tl.set("[data-intro]", { opacity: 1, y: 0 });
      } else {
        // Word masks keep natural line wrapping, so a resize never breaks the headline.
        split = SplitText.create(".hero .display", { type: "words", mask: "words", wordsClass: "sw", aria: "none" });
        tl.set(".hero .display", { opacity: 1 })
          .from(split.words, { yPercent: 115, duration: 1.3, stagger: 0.045 })
          .fromTo(".hero .eyebrow", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.15)
          .fromTo(".hero .lead", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, "-=0.95")
          .fromTo(".hero-ctas", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, "-=0.85")
          .to(".hero-meta", { opacity: 1, duration: 1 }, "-=0.8");
      }
    }, root);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, [ready]);

  /* ---------- scroll choreography ---------- */
  useIsoLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* Hero: pin and play the envelope through its three beats. */
      mm.add("(min-width: 721px)", () => {
        ScrollTrigger.create({
          trigger: ".hero",
          start: "top 80px",
          end: "+=130%",
          pin: true,
          pinSpacing: true,
          scrub: true,
          onUpdate: (self) => (heroProgress.current = self.progress),
        });
        gsap.to(".hero-inner", {
          yPercent: -32,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top 80px", end: "+=55%", scrub: true },
        });
        // immediateRender stays off so the intro timeline still owns the reveal.
        gsap.fromTo(
          ".hero-meta",
          { opacity: 1 },
          {
            opacity: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: ".hero", start: "top 80px", end: "+=25%", scrub: true },
          }
        );
      });

      /* On phones the hero stays put; scrolling past it still drives the scene. */
      mm.add("(max-width: 720px)", () => {
        ScrollTrigger.create({
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => (heroProgress.current = self.progress),
        });
      });

      gsap.to(".hero .wash", {
        yPercent: (i) => (i % 2 ? -40 : 30),
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });

      /* Provider marquee, nudged by scroll velocity. */
      const track = document.querySelector(".strip-track") as HTMLElement | null;
      if (track && !reduced) {
        const loop = gsap.to(track, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
        ScrollTrigger.create({
          trigger: ".strip",
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = 1 + Math.min(6, Math.abs(self.getVelocity()) / 350);
            gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
            gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false });
          },
        });
      }

      /* Generic reveals. */
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 1.3,
          ease: "craft",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        gsap.from(group.children, {
          y: 56,
          opacity: 0,
          duration: 1.2,
          ease: "craft",
          stagger: 0.09,
          scrollTrigger: { trigger: group, start: "top 85%", once: true },
        });
      });

      /* Pipeline. */
      gsap.from(".pipeline .pill", {
        scale: 0.6,
        opacity: 0,
        duration: 0.9,
        ease: "back.out(1.6)",
        stagger: 0.07,
        scrollTrigger: { trigger: ".pipeline", start: "top 75%", once: true },
      });
      gsap.from(".pipeline-hub", {
        scale: 0.4,
        opacity: 0,
        duration: 1.4,
        ease: "craft",
        scrollTrigger: { trigger: ".pipeline", start: "top 75%", once: true },
      });

      /* Counters. */
      gsap.utils.toArray<HTMLElement>(".num-value").forEach((el) => {
        const target = Number(el.dataset.value ?? 0);
        const suffix = el.dataset.suffix ?? "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v) + suffix;
          },
        });
      });

      /* Horizontal template gallery. */
      mm.add("(min-width: 861px)", () => {
        const gTrack = document.querySelector(".gallery-track") as HTMLElement | null;
        if (!gTrack) return;
        const distance = () => Math.max(0, gTrack.scrollWidth - window.innerWidth + 40);
        gsap.to(gTrack, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".gallery-pin",
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(".gallery-progress i", { scaleX: self.progress }),
          },
        });
      });

      /* Statement fills in word by word. */
      gsap.to(".statement .w", {
        opacity: 1,
        stagger: 0.05,
        ease: "none",
        scrollTrigger: { trigger: ".statement", start: "top 80%", end: "bottom 45%", scrub: true },
      });

      /* Feature blobs drift. */
      gsap.utils.toArray<HTMLElement>(".shape").forEach((s, i) => {
        gsap.to(s, {
          y: (i % 2 ? -1 : 1) * (40 + i * 18),
          x: (i % 2 ? 1 : -1) * 20,
          rotate: i * 12,
          ease: "none",
          scrollTrigger: { trigger: ".feature-hero", start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      /* CTA washes. */
      gsap.to(".cta .wash", {
        xPercent: (i) => (i ? -25 : 25),
        yPercent: (i) => (i ? 20 : -20),
        ease: "none",
        scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
      });

      /* Footer wordmark. */
      gsap.from(".footer-word .ch", {
        yPercent: 110,
        duration: 1.4,
        ease: "craft",
        stagger: 0.035,
        scrollTrigger: { trigger: ".footer-word", start: "top 95%", once: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  /* ---------- magnetic buttons ---------- */
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;
    const offs = gsap.utils.toArray<HTMLElement>("[data-magnetic]").map((el) => {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.25,
          y: (e.clientY - r.top - r.height / 2) * 0.35,
          duration: 0.6,
          ease: "power3.out",
        });
      };
      const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.set(el, { x: 0, y: 0 });
      };
    });
    return () => offs.forEach((off) => off());
  }, [ready]);

  /* ---------- FAQ accordion ---------- */
  const firstFaqRun = useRef(true);
  useEffect(() => {
    const items = gsap.utils.toArray<HTMLElement>(".faq-item");
    items.forEach((item, i) => {
      const panel = item.querySelector(".faq-a") as HTMLElement | null;
      if (!panel) return;
      const open = openFaq === i;
      if (firstFaqRun.current) {
        gsap.set(panel, { height: open ? "auto" : 0 });
        return;
      }
      gsap.to(panel, {
        height: open ? "auto" : 0,
        duration: 0.7,
        ease: "craft",
        onComplete: () => ScrollTrigger.refresh(),
      });
    });
    firstFaqRun.current = false;
  }, [openFaq]);

  return (
    <div ref={root} className="page">
      <Preloader onDone={onIntroDone} />
      <Cursor />

      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="announce">
        <div className="container">
          <span>
            New <span className="msg-long">· 14 hand-set email templates, ready to send from your own inbox</span>
          </span>
          <Link href="/compose">Open composer</Link>
        </div>
      </div>

      <Nav scrolled={scrolled} progress={progress} />

      <main id="main">
        {/* ---------------- Hero ---------------- */}
        <section className="hero">
          <div className="wash wash-coral" style={{ width: 620, height: 620, left: "-8%", top: "28%" }} />
          <div className="wash wash-mint" style={{ width: 560, height: 560, right: "-6%", top: "38%" }} />
          <div className="wash wash-gold" style={{ width: 380, height: 380, left: "40%", top: "70%" }} />
          <HeroScene progress={heroProgress} ready={readyRef} />

          <div className="container hero-inner">
            <span className="eyebrow" data-intro>
              Email composer · Send from your inbox
            </span>
            <h1 className="display" data-intro>
              Compose email that reads like it was <span className="italic">typeset.</span>
            </h1>
            <p className="lead" data-intro>
              Pick one of 14 hand-set templates or write your own HTML and CSS. Preview it live, then send it through your own
              Gmail, Outlook or any SMTP account.
            </p>
            <div className="hero-ctas" data-intro>
              <Link href="/compose" className="btn btn-blue" data-magnetic data-cursor-label="Compose">
                Start composing <span className="arrow">▸</span>
              </Link>
              <a href="#templates" className="btn btn-ghost">
                Browse templates
              </a>
            </div>
          </div>

          <div className="hero-meta" data-intro>
            <div className="container">
              <span>14 templates · Live HTML editor</span>
              <span className="scroll-cue">
                Scroll <i />
              </span>
            </div>
          </div>
        </section>

        {/* ---------------- Provider strip ---------------- */}
        <div className="strip" aria-label="Works with">
          <div className="strip-track">
            {[...PROVIDERS, ...PROVIDERS].map((p, i) => (
              <span key={i} aria-hidden={i >= PROVIDERS.length}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* ---------------- How it works ---------------- */}
        <section className="section" id="how">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">How it works</span>
                <h2 className="h-lg" style={{ marginTop: 20 }} data-reveal>
                  From blank page to inbox, <span className="italic">without the plumbing.</span>
                </h2>
              </div>
              <p className="lead" data-reveal>
                Your content goes in on the left, Postcraft renders bulletproof HTML in the middle, and your own mail account
                delivers it on the right.
              </p>
            </div>

            <div className="pipeline" ref={pipeRef}>
              <div className="wash wash-sky" style={{ width: 420, height: 420, left: -120, bottom: -160, opacity: 0.6 }} />
              <svg className="pipeline-svg" aria-hidden="true">
                {paths.map((d, i) => (
                  <g key={i}>
                    <path className="wire" d={d} />
                    <path d={d} className="flow" style={{ animationDelay: `${i * -0.3}s` }} />
                  </g>
                ))}
              </svg>
              <div className="pipeline-grid">
                <div className="pipeline-col left">
                  <span className="pill">
                    <span className="ico">▤</span> 14 Templates
                  </span>
                  <span className="pill">
                    <span className="ico">‹/›</span> Your HTML
                  </span>
                  <span className="pill">
                    <span className="ico">✎</span> Custom CSS
                  </span>
                  <span className="pill">
                    <span className="ico">⎙</span> Attachments
                  </span>
                </div>
                <div className="pipeline-hub">
                  <div>
                    <span className="logo">
                      <span className="logo-mark" /> postcraft
                    </span>
                    <small>Render · Inline · Send</small>
                  </div>
                </div>
                <div className="pipeline-col right">
                  <span className="pill">
                    <span className="ico">◎</span> Gmail SMTP
                  </span>
                  <span className="pill">
                    <span className="ico">◎</span> Outlook
                  </span>
                  <span className="pill">
                    <span className="ico">◎</span> Zoho · Yahoo
                  </span>
                  <span className="pill">
                    <span className="ico">◎</span> Any SMTP
                  </span>
                </div>
              </div>
            </div>

            <div className="steps" data-stagger>
              {STEPS.map(([n, t, d]) => (
                <div className="step" key={n}>
                  <span className="step-num">Step {n}</span>
                  <div>
                    <h3 className="h-sub">{t}</h3>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Numbers ---------------- */}
        <section className="section numbers-section">
          <div className="container">
            <div className="numbers" data-stagger>
              {NUMBERS.map(([value, suffix, label, note]) => (
                <div className="num" key={label}>
                  <span className="num-value" data-value={value} data-suffix={suffix}>
                    0{suffix}
                  </span>
                  <strong>{label}</strong>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Template gallery ---------------- */}
        <section className="gallery" id="templates">
          <div className="gallery-pin">
            <div className="container gallery-top">
              <div>
                <span className="eyebrow">The library</span>
                <h2 className="h-lg" style={{ marginTop: 20 }}>
                  {TEMPLATES.length} templates, <span className="italic">set with care.</span>
                </h2>
              </div>
              <div className="gallery-tools">
                <div className="gallery-progress" aria-hidden="true">
                  <i />
                </div>
                <Link href="/compose" className="link-arrow">
                  Open all →
                </Link>
              </div>
            </div>
            <div className="gallery-track" data-lenis-prevent>
              {TEMPLATES.map((t, i) => (
                <TemplateCard tpl={t} index={i} key={t.id} />
              ))}
              <Link href="/compose" className="tpl-card tpl-card-end" data-cursor-label="Open">
                <span className="tpl-end-inner">
                  <h3 className="h-lg">
                    Start <span className="italic">composing.</span>
                  </h3>
                  <p className="lead">Every template opens straight into the editor, filled in and ready to change.</p>
                  <span className="btn btn-blue">
                    Open composer <span className="arrow">▸</span>
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Statement ---------------- */}
        <section className="section">
          <div className="container">
            <p className="statement">
              {STATEMENT.split(" ").map((w, i) => (
                <span key={i} className="w">
                  {w}{" "}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section className="section" id="features" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Features</span>
                <h2 className="h-lg" style={{ marginTop: 20 }} data-reveal>
                  Everything a careful sender needs.
                </h2>
              </div>
              <p className="lead" data-reveal>
                No accounts, no subscriptions, no tracking pixels. Just a composer, a preview and your own outbox.
              </p>
            </div>
            <div className="features" data-stagger>
              <div className="feature feature-hero">
                <div className="copy">
                  <span className="ico">◐</span>
                  <h3 className="h-sub">Live, side-by-side preview</h3>
                  <p>
                    Every keystroke re-renders the real email in a sandboxed frame. Toggle desktop and mobile widths to see
                    exactly what lands in the inbox.
                  </p>
                </div>
                <div className="shapes" aria-hidden="true">
                  <span className="shape s1" />
                  <span className="shape s2" />
                  <span className="shape s3" />
                  <span className="shape s4" />
                </div>
              </div>
              {FEATURES.map(([ico, title, body]) => (
                <div className="feature" key={title}>
                  <span className="ico">{ico}</span>
                  <h3 className="h-sub">{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="section" id="faq" style={{ paddingTop: 40 }}>
          <div className="container faq-grid">
            <div>
              <span className="eyebrow">FAQ</span>
              <h2 className="h-lg" style={{ marginTop: 20 }} data-reveal>
                Questions, <span className="italic">answered.</span>
              </h2>
            </div>
            <div className="faq-list">
              {FAQ.map((f, i) => (
                <div className={`faq-item${openFaq === i ? " open" : ""}`} key={f.q}>
                  <h3>
                    <button
                      className="faq-q"
                      id={`faq-q-${i}`}
                      aria-expanded={openFaq === i}
                      aria-controls={`faq-a-${i}`}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      {f.q}
                      <span className="chev" aria-hidden="true">
                        ↓
                      </span>
                    </button>
                  </h3>
                  <div className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                    <div className="faq-a-inner">{f.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="cta">
              <CtaScene />
              <div className="wash wash-coral" style={{ width: 520, height: 520, left: -140, top: -180 }} />
              <div className="wash wash-mint" style={{ width: 520, height: 520, right: -140, bottom: -200 }} />
              <div className="cta-inner">
                <h2 className="display" data-reveal>
                  Write something <span className="italic">worth opening.</span>
                </h2>
                <p className="lead">Free, private, and ready in your browser. No sign-up required.</p>
                <div className="hero-ctas">
                  <Link href="/compose" className="btn btn-blue" data-magnetic data-cursor-label="Compose">
                    Start composing <span className="arrow">▸</span>
                  </Link>
                  <Link href="/compose?mode=html" className="btn btn-ghost">
                    Write raw HTML
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="logo">
                <span className="logo-mark" /> postcraft
              </span>
              <p className="muted">A quiet tool for composing beautiful email and sending it from your own account.</p>
            </div>
            <div className="footer-cols">
              <div>
                <h4>Product</h4>
                <Link href="/compose">Composer</Link>
                <Link href="/compose?mode=html">HTML editor</Link>
                <a href="#templates">Templates</a>
              </div>
              <div>
                <h4>Learn</h4>
                <a href="#how">How it works</a>
                <a href="#faq">App passwords</a>
                <a href="#features">Features</a>
              </div>
            </div>
          </div>
          <p className="footer-word" aria-hidden="true">
            {"postcraft".split("").map((c, i) => (
              <span key={i} className="ch">
                {c}
              </span>
            ))}
          </p>
          <div className="footer-bottom">
            <small>© {new Date().getFullYear()} Postcraft. All rights reserved.</small>
            <small className="footer-by">
              Made by <strong>Prajwal A Bhandagi</strong>
            </small>
            <small>Credentials are never stored on our servers</small>
          </div>
        </div>
      </footer>
    </div>
  );
}
