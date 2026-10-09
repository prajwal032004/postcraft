"use client";

/**
 * One place to register GSAP plugins and the project's signature easings.
 * Every client component imports gsap from here so registration can never
 * race a tween.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);

  // Signature easings — a long, soft settle for type and a crisper one for UI.
  CustomEase.create("craft", "0.16, 1, 0.3, 1");
  CustomEase.create("craftIn", "0.7, 0, 0.84, 0");
  CustomEase.create("craftInOut", "0.83, 0, 0.17, 1");

  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

if (typeof window !== "undefined") registerGsap();

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase };
