"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { lockScroll, unlockScroll } from "@/lib/smoothScroll";
import { SITE } from "@/lib/site";

const SESSION_KEY = "postcraft:seen-intro";
const COLUMNS = 6;

/**
 * A short typographic curtain. It holds the scroll until the fonts have
 * settled, so the hero never animates mid-swap, and it only plays once per
 * browser session.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [skipped] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const finish = () => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* private mode */
      }
      onDone();
    };

    if (skipped || prefersReducedMotion()) {
      finish();
      return;
    }

    lockScroll();
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      unlockScroll();
    };

    const ctx = gsap.context(() => {
      const counter = { v: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          release();
          finish();
        },
      });

      tl.from(".pre-mark", { yPercent: 120, opacity: 0, duration: 1, ease: "craft", stagger: 0.05 })
        .to(counter, {
          v: 100,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => setCount(Math.round(counter.v)),
        }, 0.1)
        .to(".pre-bar i", { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0.1)
        .to(".pre-inner", { yPercent: -40, opacity: 0, duration: 0.7, ease: "craftIn" }, "+=0.1")
        .to(
          ".pre-col",
          { scaleY: 0, transformOrigin: "top center", duration: 0.9, ease: "craftInOut", stagger: { each: 0.055, from: "start" } },
          "-=0.45"
        )
        .set(root.current, { display: "none" });
    }, root);

    // Never trap the page if an animation frame is lost (background tab, etc.).
    const bail = window.setTimeout(() => {
      release();
      finish();
    }, 6000);

    return () => {
      window.clearTimeout(bail);
      release();
      ctx.revert();
    };
  }, [onDone, skipped]);

  if (skipped) return null;

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="pre-cols">
        {Array.from({ length: COLUMNS }, (_, i) => (
          <span className="pre-col" key={i} />
        ))}
      </div>
      <div className="pre-inner">
        <p className="pre-word">
          {SITE.wordmark.split("").map((c, i) => (
            <span className="pre-mark" key={i}>
              {c === " " ? " " : c}
            </span>
          ))}
        </p>
        <div className="pre-foot">
          <span className="pre-count">{String(count).padStart(3, "0")}</span>
          <span className="pre-bar">
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}
