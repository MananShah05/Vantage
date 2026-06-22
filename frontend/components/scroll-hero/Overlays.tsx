"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ease, dur } from "../../lib/motion";
import { TICKER_TAPE } from "./sceneContent";

const EASE_OUT = ease.out as unknown as [number, number, number, number];

interface PipelineStep {
  stage: string;
  title: string;
  desc: string;
  status: "active" | "online" | "syncing";
}

const PIPELINE_STEPS: Record<string, PipelineStep> = {
  hero: {
    stage: "00",
    title: "Vantage Engine",
    desc: "Scroll to initiate intelligence review",
    status: "active",
  },
  pm: {
    stage: "01",
    title: "Portfolio Context",
    desc: "Analyzing portfolio manager workflow",
    status: "active",
  },
  ingest: {
    stage: "02",
    title: "Live Feed Ingest",
    desc: "FastAPI pulling index prices & Currencies",
    status: "online",
  },
  period: {
    stage: "03",
    title: "Period Mathematics",
    desc: "Computing MTD, QTD, YTD returns on server",
    status: "active",
  },
  table: {
    stage: "04",
    title: "Interactive Report",
    desc: "Sorting, re-ranking indices dynamically",
    status: "active",
  },
  resilient: {
    stage: "05",
    title: "Failover Resilience",
    desc: "Partial-failure logic handles dropped signals",
    status: "online",
  },
  execution: {
    stage: "06",
    title: "Review Complete",
    desc: "Generating commentary & client report",
    status: "online",
  },
  cta: {
    stage: "07",
    title: "System Ready",
    desc: "Interactive review is loaded below",
    status: "online",
  },
};

/* ── Minimal Pipeline Widget (top-right) ────────────────────────────────── */
export function PipelineWidget({ sceneKey }: { sceneKey: string }) {
  const step = PIPELINE_STEPS[sceneKey] || PIPELINE_STEPS.hero;
  const stageNum = parseInt(step.stage, 10);
  const isLeft = stageNum % 2 !== 0;
  const initialX = isLeft ? -24 : 24;
  const exitX = isLeft ? -16 : 16;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sceneKey}
        initial={{ opacity: 0, x: initialX }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: exitX }}
        transition={{ duration: dur.fast, ease: EASE_OUT }}
        style={{
          position: "absolute",
          top: "7.5rem",
          left: isLeft ? "6%" : "auto",
          right: isLeft ? "auto" : "6%",
          width: 320,
          zIndex: 40,
          borderRadius: 16,
          padding: "18px 22px",
          background: "rgba(18, 16, 15, 0.93)", /* Rich dark backdrop to block background letters */
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)", /* High contrast borders */
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.65)", /* Deep elegant drop shadow */
        }}
      >
        <div className="flex justify-between items-center mb-2.5">
          <span
            className="type-mono"
            style={{
              color: "var(--accent)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
            }}
          >
            STAGE {step.stage}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] pulse-green" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "rgba(255, 255, 255, 0.8)", /* Bright high contrast text */
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {step.status}
            </span>
          </span>
        </div>
        <h4
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            fontWeight: 600,
            color: "#ffffff", /* Pure white for readability */
            marginBottom: "6px",
            letterSpacing: "-0.01em",
          }}
        >
          {step.title}
        </h4>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.65)", /* High contrast description text */
            lineHeight: "1.45",
            margin: 0,
          }}
        >
          {step.desc}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Ticker tape (scene 0) ──────────────────────────────────────────────── */
export function TickerTape() {
  const doubled = [...TICKER_TAPE, ...TICKER_TAPE];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        overflow: "hidden",
        borderTop: "1px solid var(--ink-800)",
        background: "oklch(8% 0.008 60 / 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "10px 0",
        zIndex: 20,
      }}
    >
      <div className="ticker-scroll" style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
        {doubled.map((t, i) => (
          <span
            key={i}
            className="type-mono"
            style={{ padding: "0 1.5rem", color: "var(--ink-400)" }}
          >
            {t.label}{" "}
            <span style={{ color: t.positive ? "var(--positive)" : "var(--negative)" }}>
              {t.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
