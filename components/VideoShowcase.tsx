"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { VIDEO } from "@/lib/video";


/**
 * The clip is a silent screen recording, so it can loop muted in view without
 * ambushing anyone. Two observers do the work: an outer one attaches the 2.3MB
 * source only when the section gets close, and an inner one plays and pauses
 * it as it enters and leaves the viewport. Nothing downloads on first paint.
 *
 * There is no audio and no narration, so the written steps rendered beside
 * this component are the accessible alternative.
 */
export default function VideoShowcase({ chromeLabel = "myaccount.google.com/apppasswords" }: { chromeLabel?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  // Attach the source only once the section is nearly on screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el || armed) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setArmed(true);
        io.disconnect();
      },
      { rootMargin: "500px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  // Play while genuinely visible, pause when it scrolls away.
  useEffect(() => {
    const el = wrap.current;
    if (!el || !armed) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = video.current;
        if (!v) return;
        if (entry.isIntersecting) {
          if (!reduced.current) void v.play().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  // Never keep decoding in a hidden tab.
  useEffect(() => {
    const onHide = () => {
      const v = video.current;
      if (document.hidden && v && !v.paused) v.pause();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }, []);

  const mmss = `0:${String(VIDEO.seconds).padStart(2, "0")}`;

  return (
    <div className="vid" ref={wrap}>
      <div className="vid-chrome" aria-hidden="true">
        <span className="vid-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="vid-url">{chromeLabel}</span>
        <span className="vid-time">{mmss}</span>
      </div>

      <div className="vid-stage" style={{ aspectRatio: `${VIDEO.width} / ${VIDEO.height}` }}>
        <video
          ref={video}
          className={playing ? "is-playing" : ""}
          poster={VIDEO.poster}
          width={VIDEO.width}
          height={VIDEO.height}
          muted
          loop
          playsInline
          preload="none"
          aria-label={VIDEO.label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress(v.currentTime / v.duration);
          }}
        >
          {armed && <source src={VIDEO.src} type="video/mp4" />}
        </video>

        <button className="vid-toggle" onClick={toggle} aria-label={playing ? "Pause the walkthrough" : "Play the walkthrough"}>
          <span className={`vid-icon${playing ? " pause" : ""}`} aria-hidden="true" />
        </button>

        <span className="vid-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </span>
      </div>
    </div>
  );
}
