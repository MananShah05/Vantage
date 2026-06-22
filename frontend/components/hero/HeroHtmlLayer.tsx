"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import CTAButton from "./CTAButton";

const INDICES = ["SPY", "QQQ", "EEM", "VGK", "AGG", "GLD", "DXY"];

interface NarrationDef {
  id: string;
  range: [number, number];
  text: string;
  pos: { left?: string; right?: string; top: string };
}

const NARRATIONS: NarrationDef[] = [
  { id: "act1", range: [0.08, 0.18], text: "Live index data. Computed. Rendered.", pos: { left: "12vw", top: "30vh" } },
  { id: "act2", range: [0.3, 0.42], text: "7 indices. Real-time via yfinance. No key.", pos: { left: "14vw", top: "34vh" } },
  { id: "act3", range: [0.5, 0.64], text: "MTD · QTD · YTD · 1Y · 3Y · 5Y. pandas period math.", pos: { left: "30vw", top: "28vh" } },
  { id: "act4", range: [0.72, 0.82], text: "Recharts. Responsive. Cross-index.", pos: { right: "16vw", top: "32vh" } },
];

function NarrationBubble({
  scrollYProgress,
  def,
}: {
  scrollYProgress: MotionValue<number>;
  def: NarrationDef;
}) {
  const [s, e] = def.range;
  const opacity = useTransform(scrollYProgress, [s - 0.03, s, e, e + 0.03], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [s - 0.03, s], [12, 0]);
  return (
    <motion.div
      style={{
        position: "absolute",
        left: def.pos.left,
        right: def.pos.right,
        top: def.pos.top,
        opacity,
        y,
        background: "var(--bg-raised)",
        color: "var(--tx-primary)",
        fontFamily: "var(--font-inter)",
        fontSize: 14,
        padding: "10px 16px",
        borderRadius: 10,
        maxWidth: 320,
        border: "1px solid var(--bg-surface)",
      }}
    >
      {def.text}
    </motion.div>
  );
}

interface HeroHtmlLayerProps {
  scrollYProgress: MotionValue<number>;
  act1: MotionValue<number>;
  act5: MotionValue<number>;
}

export default function HeroHtmlLayer({ scrollYProgress, act1, act5 }: HeroHtmlLayerProps) {
  const titleOpacity = useTransform(act1, [0.3, 0.9], [0, 1]);
  const titleY = useTransform(act1, [0.3, 0.9], [40, 0]);
  const subOpacity = useTransform(act1, [0.5, 1], [0, 1]);

  // Title also fades back out as the camera dives into the scene (Act II).
  const titleFade = useTransform(scrollYProgress, [0.18, 0.26], [1, 0]);

  const taglineOpacity = useTransform(scrollYProgress, [0.8, 0.88, 0.94], [0, 1, 0]);

  const ctaOpacity = useTransform(act5, [0.4, 0.8], [0, 1]);
  const ctaY = useTransform(act5, [0.4, 0.8], [24, 0]);

  return (
    <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }}>
      {/* Title — Act I */}
      <motion.div
        style={{ position: "absolute", left: "8vw", top: "20vh", opacity: titleFade }}
      >
        <motion.h1
          style={{
            opacity: titleOpacity,
            y: titleY,
            fontFamily: "var(--font-inter)",
            fontSize: "clamp(48px, 8vw, 92px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: "var(--tx-primary)",
            margin: 0,
          }}
        >
          VANTAGE
        </motion.h1>
        <motion.p
          style={{
            opacity: subOpacity,
            marginTop: 16,
            maxWidth: "42ch",
            fontFamily: "var(--font-inter)",
            fontSize: 18,
            color: "var(--tx-secondary)",
          }}
        >
          Automated, institutional-style market review.
        </motion.p>

        {/* Index badge row */}
        <motion.div style={{ opacity: subOpacity, display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          {INDICES.map((idx, i) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "4px 8px",
                color: "var(--tx-tertiary)",
                border: "1px solid var(--bg-raised)",
                borderRadius: 4,
              }}
            >
              {idx}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* Narration bubbles */}
      {NARRATIONS.map((def) => (
        <NarrationBubble key={def.id} scrollYProgress={scrollYProgress} def={def} />
      ))}

      {/* Wide-shot tagline — Act V intro */}
      <motion.p
        style={{
          position: "absolute",
          left: "10vw",
          top: "16vh",
          opacity: taglineOpacity,
          fontFamily: "var(--font-inter)",
          fontSize: "clamp(22px, 3vw, 32px)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: "var(--tx-primary)",
        }}
      >
        7 indices. 6 horizons. Zero accounts.
      </motion.p>

      {/* CTA — Act V */}
      <motion.div
        style={{
          position: "absolute",
          right: "8vw",
          bottom: "12vh",
          opacity: ctaOpacity,
          y: ctaY,
          pointerEvents: "auto",
          textAlign: "right",
        }}
      >
        <p style={{ fontSize: 13, marginBottom: 12, color: "var(--tx-secondary)", fontFamily: "var(--font-inter)" }}>
          7 indices · 6 horizons · zero accounts
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <CTAButton primary href="#report">
            View Report
          </CTAButton>
          <CTAButton href="#report">API Docs</CTAButton>
        </div>
      </motion.div>
    </div>
  );
}
