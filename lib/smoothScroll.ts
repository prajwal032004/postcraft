"use client";

/**
 * Lenis wiring. The instance lives at module scope so the preloader, the
 * mobile drawer and the anchor links can all talk to the same scroller.
 * GSAP's ticker drives Lenis, and every Lenis scroll event updates
 * ScrollTrigger — the pairing GSAP recommends for pinned sections.
 */
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap";

type ScrollInfo = { scroll: number; velocity: number; progress: number };

let instance: Lenis | null = null;
let locks = 0;

export const getLenis = () => instance;

export function initSmoothScroll(onScroll?: (info: ScrollInfo) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const reduced = prefersReducedMotion();
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !reduced,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });
  instance = lenis;

  const handle = (l: Lenis) => {
    ScrollTrigger.update();
    onScroll?.({ scroll: l.scroll, velocity: l.velocity, progress: l.progress });
  };
  lenis.on("scroll", handle);

  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  // Same-page anchors, routed through Lenis so they share its easing.
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    const hash = a.getAttribute("href") ?? "";
    if (hash.length < 2) return;
    const el = document.querySelector(hash) as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    scrollToTarget(el);
  };
  document.addEventListener("click", onClick);

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  document.fonts?.ready.then(refresh).catch(() => {});

  return () => {
    document.removeEventListener("click", onClick);
    window.removeEventListener("load", refresh);
    lenis.off("scroll", handle);
    gsap.ticker.remove(raf);
    lenis.destroy();
    instance = null;
    locks = 0;
    document.documentElement.classList.remove("scroll-locked");
  };
}

/** Nestable scroll lock — the preloader and the drawer can overlap safely. */
export function lockScroll() {
  locks += 1;
  instance?.stop();
  document.documentElement.classList.add("scroll-locked");
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  instance?.start();
  document.documentElement.classList.remove("scroll-locked");
}

export function scrollToTarget(target: string | HTMLElement, offset = -72) {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1.4, force: true });
    return;
  }
  const el = typeof target === "string" ? (document.querySelector(target) as HTMLElement | null) : target;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
