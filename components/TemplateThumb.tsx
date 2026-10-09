"use client";

import { useEffect, useRef, useState } from "react";
import { Template, renderTemplate } from "@/lib/templates";

/**
 * A real miniature of the email, not a colour swatch.
 *
 * The template renders into a sandboxed iframe at a fixed design width and is
 * then scaled down to whatever width the card happens to be, so the same
 * component works in the 170px composer grid and the 308px landing card.
 * The frame only mounts once the card nears the viewport, which keeps a
 * fourteen-template library from building fourteen documents at once.
 */

const DESIGN_W = 680;

type Props = {
  tpl: Template;
  /** Height as a multiple of width. */
  ratio?: number;
  /** Skip the intersection gate for the first visible cards. */
  eager?: boolean;
  className?: string;
};

export default function TemplateThumb({ tpl, ratio = 1.25, eager = false, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [live, setLive] = useState(eager);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / DESIGN_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || live) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLive(true);
        io.disconnect();
      },
      { rootMargin: "500px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [live]);

  return (
    <div
      className={`thumb ${className}`.trim()}
      ref={box}
      style={{
        aspectRatio: `1 / ${ratio}`,
        // Doubles as the loading state, using the template's own palette.
        backgroundImage: `linear-gradient(145deg, ${tpl.swatch[0]}, ${tpl.swatch[1]})`,
      }}
    >
      {live && scale > 0 && (
        <iframe
          title={`${tpl.name} preview`}
          srcDoc={renderTemplate(tpl)}
          sandbox="allow-same-origin"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className={loaded ? "ready" : ""}
          onLoad={() => setLoaded(true)}
          style={{
            width: DESIGN_W,
            height: Math.round(DESIGN_W * ratio),
            transform: `scale(${scale})`,
          }}
        />
      )}
    </div>
  );
}
