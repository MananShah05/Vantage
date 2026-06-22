"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { variants } from "../lib/motion";
import dynamic from "next/dynamic";

const Walkthrough3D = dynamic(() => import("./Walkthrough3D"), { ssr: false });

// --- Micro-visuals ---
function DataIngestVisual() {
  const [active, setActive] = useState(0);
  const tickers = ["^GSPC", "EFA", "EEM", "AGG", "VNQ", "GLD", "DX-Y.NYB"];
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % tickers.length), 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col gap-2 w-full">
      {tickers.map((t, i) => (
        <div key={t} className="flex items-center gap-3">
          <span className="type-mono w-28 transition-colors duration-300"
            style={{ color: i === active ? "var(--accent)" : "var(--ink-700)" }}>
            {t}
          </span>
          <div className="flex-1 h-px" style={{ background: "oklch(100% 0 0 / 0.06)" }}>
            <div className="h-full transition-all duration-500"
              style={{
                width: i <= active ? "100%" : "0%",
                background: i === active ? "var(--accent)" : "oklch(100% 0 0 / 0.15)",
              }} />
          </div>
          <span className="transition-colors duration-300"
            style={{
              fontFamily: "var(--font-mono)", fontSize: "var(--text-ui-sm)",
              color: i < active ? "var(--positive)" : i === active ? "var(--accent)" : "var(--ink-700)",
            }}>
            {i < active ? "✓" : i === active ? "↓" : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function PeriodVisual() {
  const periods = [
    { label: "MTD", value: "+2.1%" }, { label: "QTD", value: "+5.4%" },
    { label: "YTD", value: "+18.4%" }, { label: "1Y", value: "+22.7%" },
    { label: "3Y ann.", value: "+10.2%" }, { label: "5Y ann.", value: "+14.1%" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {periods.map(({ label, value }) => (
        <div key={label} className="rounded-md px-3 py-2 text-center"
          style={{ background: "oklch(15% 0.008 60)", border: "1px solid oklch(100% 0 0 / 0.07)" }}>
          <div style={{ fontFamily: "var(--font-inter)", fontSize: "var(--text-ui-xs)",
            color: "var(--ink-400)", marginBottom: "2px" }}>{label}</div>
          <div className="type-mono" style={{ fontSize: "var(--text-ui-sm)",
            fontWeight: 600, color: "var(--positive)" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// Em dashes are banned per typography specifications (commas, colons, or parentheses only)
function TableVisual() {
  const rows = [
    { label: "S&P 500", ytd: "+18.4%", pos: true },
    { label: "MSCI EM",  ytd: "+6.8%",  pos: true },
    { label: "US Agg",   ytd: "-2.1%",  pos: false },
    { label: "Gold",     ytd: "+22.1%", pos: true },
  ];
  return (
    <table className="w-full">
      <thead>
        <tr style={{ borderBottom: "1px solid oklch(100% 0 0 / 0.07)" }}>
          <th className="text-left pb-2" style={{ fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-xs)", fontWeight: 500, color: "var(--ink-700)" }}>Index</th>
          <th className="text-right pb-2" style={{ fontFamily: "var(--font-inter)",
            fontSize: "var(--text-ui-xs)", fontWeight: 500, color: "var(--ink-700)" }}>YTD</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} style={{ borderBottom: "1px solid oklch(100% 0 0 / 0.04)" }}>
            <td className="py-1.5" style={{ fontFamily: "var(--font-inter)",
              fontSize: "var(--text-ui-sm)", color: "var(--ink-400)" }}>{r.label}</td>
            <td className="py-1.5 text-right type-mono"
              style={{ fontSize: "var(--text-ui-sm)", fontWeight: 600,
                color: r.pos ? "var(--positive)" : "var(--negative)" }}>{r.ytd}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChartVisual() {
  const bars = [
    { label: "S&P", val: 84, pos: true },  { label: "EAFE", val: 52, pos: true },
    { label: "Agg",  val: -10, pos: false }, { label: "Gold",  val: 100, pos: true },
    { label: "REITs",val: 42, pos: true },
  ];
  return (
    <div className="flex items-end gap-3 w-full" style={{ height: "96px" }}>
      {bars.map(({ label, val, pos }) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end w-full justify-center" style={{ height: "80px" }}>
            <div className="w-full rounded-t-sm"
              style={{ height: `${Math.abs(val)}%`,
                background: pos ? "var(--positive)" : "var(--negative)", opacity: 0.8 }} />
          </div>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "var(--text-ui-xs)",
            color: "var(--ink-700)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// --- Steps data ---
const STEPS = [
  { number: "01", label: "Data Ingestion",       title: "Pull from 7 live indices",
    body: "yfinance fetches adjusted close prices for S&P 500, MSCI EAFE, MSCI EM, US Agg Bond, REITs, Gold, and DXY on every request.",
    visual: <DataIngestVisual /> },
  { number: "02", label: "Period Computation",   title: "MTD, QTD, YTD, 1Y, 3Y, 5Y",
    body: "FastAPI computes all period returns server-side. Multi-year figures annualised with compound growth (no stale spreadsheets).",
    visual: <PeriodVisual /> },
  { number: "03", label: "Interactive Report",   title: "Colour-coded returns table",
    body: "Positive returns in green, negative in red. Sort by any period. At a glance (as Mercer presents it).",
    visual: <TableVisual /> },
  { number: "04", label: "Recharts Visualisation", title: "Bar charts, comparisons, trends",
    body: "Recharts renders YTD comparisons and period bars. Responsive, interactive tooltips, no third-party cost.",
    visual: <ChartVisual /> },
];

export default function FeatureWalkthrough() {
  const [activeStep, setActiveStep] = useState(0);
  const [use3D, setUse3D] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    AOS.init({ duration: 650, easing: "ease-out-quart", once: true, offset: 80 });

    // WebGL support check
    let webglSupported = false;
    try {
      const canvas = document.createElement("canvas");
      webglSupported = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      webglSupported = false;
    }

    // Reduced motion check
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = mediaQuery.matches;

    // Use 3D if supported, not prefers reduced motion, and on desktop viewport
    const isDesktop = window.innerWidth >= 1024;

    setUse3D(webglSupported && !prefersReducedMotion && isDesktop);
  }, []);

  useEffect(() => {
    const obs = stepRefs.current.map((el, i) => {
      if (!el) return null;
      const o = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveStep(i); },
        { threshold: 0.5 }
      );
      o.observe(el);
      return o;
    });
    return () => obs.forEach((o) => o?.disconnect());
  }, []);

  return (
    <section id="walkthrough" className="relative py-24 px-6 md:px-12 max-w-7xl mx-auto">

      {/* Section header */}
      <div className="mb-20 max-w-xl" data-aos="fade-up">
        <p className="type-overline mb-3">How it works</p>
        <h2 className="type-d2 mb-4" style={{ color: "var(--ink-100)" }}>
          From raw data to<br />polished report
        </h2>
        <p className="type-body" style={{ color: "var(--ink-400)", fontSize: "var(--text-ui-lg)" }}>
          Four automated steps replace hours of manual data collection each month.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">

        {/* Steps */}
        <div className="flex-1 flex flex-col">
          {STEPS.map((step, i) => (
            <div key={i}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="relative pl-12 pb-16 cursor-pointer"
              data-aos="fade-up"
              data-aos-delay={String(i * 80)}
              onClick={() => setActiveStep(i)}
            >
              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="absolute left-4 top-10 w-px transition-colors duration-400"
                  style={{ height: "calc(100% - 40px)",
                    background: i < activeStep ? "var(--accent)" : "oklch(100% 0 0 / 0.08)" }} />
              )}

              {/* Step dot */}
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: i === activeStep ? "var(--accent)" : i < activeStep ? "var(--accent-bg)" : "var(--ink-800)",
                  border: i === activeStep ? "none" : "1px solid oklch(100% 0 0 / 0.1)",
                  color: i === activeStep ? "oklch(10% 0.01 60)" : i < activeStep ? "var(--accent)" : "var(--ink-400)",
                  boxShadow: i === activeStep ? "0 0 16px oklch(72% 0.18 68 / 0.4)" : "none",
                  fontFamily: "var(--font-inter)",
                  fontSize: "var(--text-ui-xs)",
                  fontWeight: 700,
                }}>
                {i < activeStep ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : step.number}
              </div>

              <div className="transition-opacity duration-300" style={{ opacity: i === activeStep ? 1 : 0.4 }}>
                <p className="type-overline mb-2">{step.label}</p>
                <h3 className="type-d4 mb-3" style={{ color: "var(--ink-100)" }}>{step.title}</h3>
                <p className="type-body" style={{
                  color: "var(--ink-400)",
                  fontSize: "var(--text-ui-md)",
                  maxWidth: "42ch",
                  lineHeight: "var(--lh-body)",
                }}>
                  {step.body}
                </p>
                {/* Mobile visual */}
                <div className="lg:hidden mt-6 p-5 rounded-xl"
                  style={{ background: "var(--ink-900)", border: "1px solid oklch(100% 0 0 / 0.07)" }}>
                  {step.visual}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky visual panel — desktop */}
        <div className="hidden lg:block w-96 font-sans">
          <div className="sticky top-24">
            <AnimatePresence mode="wait">
              {use3D ? (
                <div key="3d-walkthrough-panel" className="rounded-2xl p-8 min-h-[300px] flex flex-col justify-between"
                  style={{ background: "var(--ink-900)", border: "1px solid oklch(100% 0 0 / 0.08)" }}>
                  <div className="flex-1 min-h-[220px] relative">
                    <Walkthrough3D activeStep={activeStep} />
                  </div>
                  <p className="type-overline mt-6">
                    Step {STEPS[activeStep].number} — {STEPS[activeStep].label}
                  </p>
                </div>
              ) : (
                <motion.div
                  key={activeStep}
                  {...variants.panelCross}
                  className="rounded-2xl p-8 min-h-64 flex flex-col justify-between"
                  style={{ background: "var(--ink-900)", border: "1px solid oklch(100% 0 0 / 0.08)" }}
                >
                  <div className="flex-1 flex items-center">
                    {STEPS[activeStep].visual}
                  </div>
                  <p className="type-overline mt-6">
                    Step {STEPS[activeStep].number} — {STEPS[activeStep].label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
