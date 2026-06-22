"use client";

/**
 * Device + capability detection for the hero experience.
 * The full R3F scene is desktop-only; mobile gets a CSS/Framer fallback.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 768;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cap device pixel ratio for canvas to avoid GPU overdraw on retina displays. */
export function cappedDpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}
