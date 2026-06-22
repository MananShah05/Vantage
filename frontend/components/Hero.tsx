"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ease, dur, variants } from "../lib/motion";

const TICKERS = [
  { label: "S&P 500",    value: "+18.4%", positive: true  },
  { label: "MSCI EAFE",  value: "+11.2%", positive: true  },
  { label: "MSCI EM",    value: "+6.8%",  positive: true  },
  { label: "US Agg Bond",value: "-2.1%",  positive: false },
  { label: "US REITs",   value: "+9.3%",  positive: true  },
  { label: "Gold",       value: "+22.1%", positive: true  },
  { label: "DXY",        value: "-3.4%",  positive: false },
];

const DOUBLE = [...TICKERS, ...TICKERS];

const SPARKLINES = [
  "M0,40 C20,35 40,20 60,18 C80,16 100,25 120,20 C140,15 160,5 180,8",
  "M0,30 C20,38 40,42 60,30 C80,18 100,22 120,15 C140,8 160,12 180,5",
  "M0,20 C20,28 40,35 60,25 C80,15 100,30 120,22 C140,14 160,20 180,10",
  "M0,45 C20,40 40,30 60,35 C80,40 100,28 120,18 C140,10 160,15 180,8",
];

const heroContainer = variants.stagger(0.15, 0.12);

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number, t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Primary line
      ctx.beginPath();
      ctx.strokeStyle = "oklch(72% 0.18 68 / 0.3)";
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= w; x += 2) {
        const p = x / w;
        const y = h * 0.55
          + Math.sin(p * 12 + t * 0.8) * 18
          + Math.sin(p * 5  + t * 0.3) * 28;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary line
      ctx.beginPath();
      ctx.strokeStyle = "oklch(55% 0.08 240 / 0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 2) {
        const p = x / w;
        const y = h * 0.45
          + Math.sin(p * 8 + t * 0.5 + 1) * 22
          + Math.sin(p * 3 + t * 0.2 + 2) * 30;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 0.008;
      raf = requestAnimationFrame(draw);
    };
    
    // Check reduced motion setting
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mediaQuery.matches) {
      draw();
    } else {
      // Draw static frame for reduced motion
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.beginPath();
      ctx.strokeStyle = "oklch(72% 0.18 68 / 0.3)";
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= w; x += 2) {
        const p = x / w;
        const y = h * 0.55 + Math.sin(p * 12) * 18;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Canvas lines */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-80" />

      {/* Radial glow */}
      <div className="absolute pointer-events-none" style={{
        top: "15%", left: "62%", width: "640px", height: "640px",
        background: "radial-gradient(circle, oklch(72% 0.18 68 / 0.07) 0%, transparent 70%)",
        transform: "translate(-50%, -50%)",
      }} />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur.base, ease: ease.out }}
        className="relative z-10 flex items-center justify-between px-8 py-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm flex items-center justify-center"
            style={{ background: "var(--accent-bg)", border: "1px solid oklch(72% 0.18 68 / 0.3)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 11L4 6l3 2 3-5 3 2"
                stroke="oklch(72% 0.18 68)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{
            fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-md)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--ink-100)",
          }}>
            Market Review
          </span>
        </div>
        <a href="#report" style={{
          fontFamily: "var(--font-inter)",
          fontSize: "var(--text-ui-sm)",
          fontWeight: 500,
          padding: "0.375rem 1rem",
          borderRadius: "9999px",
          border: "1px solid var(--ink-700)",
          color: "var(--ink-200)",
          transition: "all 0.2s",
        }}>
          View Report
        </a>
      </motion.nav>

      {/* Hero body */}
      <motion.div
        variants={heroContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-start justify-center flex-1 px-8 md:px-16 lg:px-24 pb-32"
      >
        {/* Overline */}
        <motion.p variants={variants.fadeUp} className="type-overline mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Live market data · Updated daily
        </motion.p>

        {/* H1 — display */}
        <motion.h1 variants={variants.heroHeading}
          className="type-d1 mb-5 max-w-4xl"
          style={{ color: "var(--ink-100)" }}>
          Automated<br />
          <span style={{ color: "var(--accent)" }}>Market</span> Review
          </motion.h1>

        {/* Body */}
        <motion.p variants={variants.fadeUp}
          className="type-body mb-10"
          style={{ color: "var(--ink-400)", fontSize: "var(--text-ui-xl)" }}>
          Institutional-grade period returns across equities, fixed income,
          real assets, and currencies — pulled live, computed automatically.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={variants.fadeUp} className="flex flex-wrap gap-4">
          <a href="#report" style={{
            fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-md)",
            fontWeight: 600,
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            background: "var(--accent)",
            color: "oklch(10% 0.01 60)",
            transition: "opacity 0.2s",
          }}>
            View this month's review
          </a>
          <a href="#walkthrough" style={{
            fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-md)",
            fontWeight: 500,
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--ink-700)",
            color: "var(--ink-200)",
            transition: "all 0.2s",
          }}>
            How it works
          </a>
        </motion.div>

        {/* Decorative sparklines */}
        <motion.div variants={variants.fadeIn} className="mt-20 hidden md:flex gap-8 items-end">
          {SPARKLINES.map((path, i) => (
            <svg key={i} width="180" height="50" viewBox="0 0 180 50" fill="none" className="opacity-35">
              <path d={path}
                stroke={i % 2 === 0 ? "var(--accent)" : "oklch(55% 0.08 240)"}
                strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ))}
        </motion.div>
      </motion.div>

      {/* Ticker tape */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden py-3 z-10"
        style={{
          borderTop: "1px solid oklch(100% 0 0 / 0.06)",
          background: "oklch(10% 0.008 60 / 0.85)",
          backdropFilter: "blur(8px)",
        }}>
        <div className="flex ticker-scroll whitespace-nowrap">
          {DOUBLE.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6"
              style={{
                borderRight: "1px solid oklch(100% 0 0 / 0.06)",
                fontFamily: "var(--font-inter)",
                fontSize: "var(--text-ui-sm)",
              }}>
              <span style={{ color: "var(--ink-400)", fontWeight: 500 }}>{t.label}</span>
              <span className="type-mono"
                style={{ color: t.positive ? "var(--positive)" : "var(--negative)" }}>
                {t.value}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
