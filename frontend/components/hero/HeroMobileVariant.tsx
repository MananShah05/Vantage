"use client";

import { motion } from "framer-motion";
import CTAButton from "./CTAButton";

const INDICES = ["SPY", "QQQ", "EEM", "VGK", "AGG", "GLD", "DXY"];

/**
 * CSS + Framer-only hero for mobile. The full R3F scene is disabled on small
 * / touch devices for performance; this delivers the same message statically.
 */
export default function HeroMobileVariant() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100svh",
        overflow: "hidden",
        background: "var(--bg-base)",
        padding: "0 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Sage radial glow stand-in for the particle field */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 70% 30%, var(--ac-subtle), transparent 60%)",
        }}
      />

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "clamp(40px, 14vw, 64px)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 0.95,
          color: "var(--tx-primary)",
          margin: 0,
          position: "relative",
        }}
      >
        VANTAGE
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        style={{
          marginTop: 16,
          maxWidth: "38ch",
          fontFamily: "var(--font-inter)",
          fontSize: 16,
          color: "var(--tx-secondary)",
          position: "relative",
        }}
      >
        Automated, institutional-style market review. 7 indices, 6 horizons, zero accounts.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap", position: "relative" }}
      >
        {INDICES.map((idx) => (
          <span
            key={idx}
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
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.23, 1, 0.32, 1] }}
        style={{ display: "flex", gap: 12, marginTop: 36, position: "relative" }}
      >
        <CTAButton primary href="#report">
          View Report
        </CTAButton>
        <CTAButton href="#report">API Docs</CTAButton>
      </motion.div>
    </section>
  );
}
