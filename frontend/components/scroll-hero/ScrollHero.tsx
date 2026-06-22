"use client";

/**
 * Vantage — Scroll-Driven Hero & PM Walkthrough.
 *
 * Implements the storyboard as a sticky-canvas frame-sequence scrubber (the
 * premium "3D scroll" technique): a tall parent section drives scroll, an inner
 * sticky viewport is pinned, and a <canvas> scrubs through 480 pre-rendered
 * frames (frame_0001 → frame_0480, extracted from the 8 scene videos).
 *
 * Performance rules (per 3d-scroll-website skill):
 *  - requestAnimationFrame + ticking ref (never touch the canvas synchronously)
 *  - all hot updates go straight to the DOM via refs, never React state
 *  - React state only flips when the active scene actually changes
 *  - all frames preload behind a real progress bar before scrubbing starts
 *  - DPR-aware canvas sizing, passive scroll listeners, mobile zoom
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { ease, dur } from "../../lib/motion";
import {
  FRAME_COUNT,
  SCENES,
  sceneIndexForProgress,
} from "./sceneContent";
import {
  TickerTape,
  PipelineWidget,
} from "./Overlays";

const EASE_OUT = ease.out as unknown as [number, number, number, number];
const HERO_FADE_END = 0.055; // hero text fully gone by 5.5% scroll
const framePath = (i: number) =>
  `/frames/frame_${String(i + 1).padStart(4, "0")}.jpg`;

function prefersReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ── Reduced-motion / no-canvas fallback ────────────────────────────────── */
function StaticFallback() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundImage: `url(${framePath(0)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "oklch(8% 0.008 60 / 0.55)" }} />
      <div className="flex flex-col items-center justify-center min-h-screen text-center z-10 relative px-6">
        <h1 className="type-d3 text-[var(--ink-100)] mb-4">Vantage Market Intelligence</h1>
        <p className="type-body text-[var(--ink-400)] max-w-md">Live index returns computed automatically. Scroll down to view the report.</p>
      </div>
      <TickerTape />
    </section>
  );
}

function HeaderNavigation() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
      className="glass-header flex items-center justify-between px-8 md:px-16 py-4"
    >
      <div className="flex items-center gap-3">
        <div
          style={{ background: "var(--accent-bg)", border: "1px solid oklch(72% 0.18 68 / 0.3)" }}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 11L4 6l3 2 3-5 3 2"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-lg)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--ink-100)",
          }}
        >
          Vantage
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <a
          href="#walkthrough"
          className="hover:text-[var(--accent)] transition-colors duration-200"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-md)",
            color: "rgba(255, 255, 255, 0.75)", /* Bright contrast for menu item */
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          How It Works
        </a>
        <a
          href="#report"
          className="hover:text-[var(--accent)] transition-colors duration-200"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-md)",
            color: "rgba(255, 255, 255, 0.75)", /* Bright contrast for menu item */
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Live Report
        </a>
        <span
          className="w-2 h-2 rounded-full bg-[var(--positive)] pulse-green"
          title="Data feed online"
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-ui-xs)",
            color: "rgba(255, 255, 255, 0.55)", /* Subtle but readable status label */
            letterSpacing: "0.05em",
          }}
        >
          Feed Live
        </span>
      </nav>

      <div>
        <a
          href="#report"
          className="glow-btn"
          style={{
            background: "var(--accent)",
            color: "var(--ink-950)",
            borderRadius: 9999,
            padding: "8px 20px",
            fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-md)",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Open Report
        </a>
      </div>
    </motion.header>
  );
}

export default function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(-1);
  const tickingRef = useRef(false);
  const prevSceneRef = useRef<number>(0);

  const [mode, setMode] = useState<"pending" | "scroll" | "static">("pending");
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(0);

  // AOS for the report section below the hero.
  useEffect(() => {
    AOS.init({ duration: 650, easing: "ease-out-quart", once: true, offset: 80 });
  }, []);

  // Decide render path after mount (avoid SSR/hydration mismatch).
  useEffect(() => {
    setMode(prefersReduced() ? "static" : "scroll");
  }, []);

  // Preload all frames behind a progress bar.
  useEffect(() => {
    if (mode !== "scroll") return;
    let cancelled = false;
    let count = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = img.onerror = () => {
        if (cancelled) return;
        count++;
        setLoadProgress(count / FRAME_COUNT);
        if (count === FRAME_COUNT) setLoaded(true);
      };
      imgs.push(img);
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Canvas sizing + scroll-driven frame scrub.
  useEffect(() => {
    if (mode !== "scroll" || !loaded) return;
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;

    const drawFrame = (index: number) => {
      const img = framesRef.current[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = cw / ch;
      let drawW: number, drawH: number;
      if (canvasRatio > imgRatio) {
        drawW = cw;
        drawH = cw / imgRatio;
      } else {
        drawH = ch;
        drawW = ch * imgRatio;
      }
      if (isMobile) {
        drawW *= 1.3;
        drawH *= 1.3;
      }
      const dx = (cw - drawW) / 2;
      const dy = (ch - drawH) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, drawW, drawH);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      currentFrameRef.current = -1; // force redraw
      update();
    };

    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;

      // Frame
      const frame = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
      if (frame !== currentFrameRef.current) {
        currentFrameRef.current = frame;
        drawFrame(frame);
      }



      // Active scene (React state only on change)
      const scene = sceneIndexForProgress(progress);
      if (scene !== prevSceneRef.current) {
        prevSceneRef.current = scene;
        setActiveScene(scene);
      }
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        update();
        tickingRef.current = false;
      });
    };

    resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
    };
  }, [mode, loaded]);

  if (mode === "static") return <StaticFallback />;

  const scene = SCENES[activeScene];

  return (
    <section
      ref={sectionRef}
      className="scroll-hero"
      style={{ position: "relative", height: "800vh" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          background: "var(--ink-950)",
        }}
      >
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

        {/* Loading overlay */}
        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              background: "var(--ink-950)",
              zIndex: 50,
            }}
          >
            <span className="type-overline">Loading market intelligence</span>
            <div
              style={{
                width: 220,
                height: 2,
                background: "var(--ink-800)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round(loadProgress * 100)}%`,
                  height: "100%",
                  background: "var(--accent)",
                  transition: "width 0.2s linear",
                }}
              />
            </div>
            <span className="type-mono" style={{ color: "var(--ink-400)" }}>
              {Math.round(loadProgress * 100)}%
            </span>
          </div>
        )}

        {/* Overlays */}
        {loaded && (
          <>
            <HeaderNavigation />
            <PipelineWidget sceneKey={scene.key} />
            {scene.key === "hero" && <TickerTape />}
          </>
        )}
      </div>
    </section>
  );
}
