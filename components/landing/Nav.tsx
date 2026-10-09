"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { SITE } from "@/lib/site";
import { lockScroll, scrollToTarget, unlockScroll } from "@/lib/smoothScroll";

const LINKS = [
  { href: "#how", label: "How it works", n: "01" },
  { href: "#templates", label: "Templates", n: "02" },
  { href: "#features", label: "Features", n: "03" },
  { href: "#faq", label: "FAQ", n: "04" },
];

export default function Nav({ scrolled, progress }: { scrolled: boolean; progress: number }) {
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // Build the drawer timeline once, then play/reverse it.
  useEffect(() => {
    const ctx = gsap.context(() => {
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(".drawer-sheet", { yPercent: -101 }, { yPercent: 0, duration: 0.8, ease: "craftInOut" })
        .fromTo(
          ".drawer-link .dl-inner",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.8, ease: "craft", stagger: 0.06 },
          "-=0.4"
        )
        .fromTo(".drawer-foot > *", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, "-=0.45");
    }, drawer);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (open) {
      lockScroll();
      t.play();
    } else if (t.progress() > 0) {
      unlockScroll();
      t.reverse();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    // Let the sheet start closing before the page travels.
    window.setTimeout(() => scrollToTarget(href, -72), 420);
  };

  return (
    <>
      <header className={`nav${scrolled ? " scrolled" : ""}${open ? " nav-open" : ""}`}>
        <div className="container">
          <Link href="/" className="logo" aria-label={`${SITE.name} home`} data-cursor>
            <span className="logo-mark" />
            {SITE.wordmark}
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <Link href="/compose?mode=html" className="btn btn-ghost btn-sm hide-md">
              HTML editor
            </Link>
            <Link href="/compose" className="btn btn-blue btn-sm" data-magnetic>
              <span className="cta-long">Start composing</span>
              <span className="cta-short">Compose</span>
              <span className="arrow">▸</span>
            </Link>
            <button
              className={`burger${open ? " on" : ""}`}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="site-drawer"
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
        <span className="nav-progress" aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </span>
      </header>

      <div
        className={`drawer${open ? " open" : ""}`}
        id="site-drawer"
        ref={drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <div className="drawer-sheet">
          <nav className="drawer-links">
            {LINKS.map((l) => (
              <button key={l.href} className="drawer-link" onClick={() => go(l.href)} tabIndex={open ? 0 : -1}>
                <span className="dl-inner">
                  <em>{l.n}</em>
                  {l.label}
                </span>
              </button>
            ))}
          </nav>
          <div className="drawer-foot">
            <Link href="/compose" className="btn btn-blue" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              Start composing <span className="arrow">▸</span>
            </Link>
            <Link href="/compose?mode=html" className="btn btn-ghost" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              Write raw HTML
            </Link>
            <p className="muted">Free, private, no sign-up. Sends through your own SMTP account.</p>
          </div>
        </div>
        <button className="drawer-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />
      </div>
    </>
  );
}
