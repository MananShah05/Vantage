"use client";

import { useEffect, useState } from "react";

const COLS = ["MTD", "QTD", "YTD", "1Y", "3Y", "5Y"];

const ROWS: Array<{ idx: string; vals: string[] }> = [
  { idx: "SPY", vals: ["+1.1%", "+3.2%", "+8.4%", "+22.1%", "+9.4%", "+14.2%"] },
  { idx: "QQQ", vals: ["+1.8%", "+5.1%", "+12.3%", "+31.2%", "+11.2%", "+18.4%"] },
  { idx: "EEM", vals: ["−0.4%", "−1.2%", "−2.1%", "+4.3%", "+1.2%", "+3.1%"] },
  { idx: "VGK", vals: ["+0.6%", "+2.1%", "+6.2%", "+14.2%", "+5.4%", "+8.3%"] },
];

function valueColor(v: string) {
  if (v.startsWith("−") || v.startsWith("-")) return "var(--data-neg)";
  if (v === "0.0%") return "var(--data-flat)";
  return "var(--data-pos)";
}

export default function PeriodsPanel() {
  // Left-to-right column highlight sweep.
  const [activeCol, setActiveCol] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveCol((c) => (c + 1) % COLS.length), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        width: 560,
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-raised)",
        borderRadius: 10,
        padding: "18px 20px",
        color: "var(--tx-primary)",
        fontFamily: "var(--font-inter)",
      }}
    >
      <span className="hero-label" style={{ color: "var(--tx-secondary)" }}>
        Performance Periods
      </span>

      <div style={{ height: 1, background: "var(--bg-raised)", margin: "14px 0" }} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", paddingBottom: 8 }}>
              <span className="hero-label">Index</span>
            </th>
            {COLS.map((c, i) => (
              <th key={c} style={{ textAlign: "right", paddingBottom: 8 }}>
                <span
                  className="hero-label"
                  style={{
                    color: i === activeCol ? "var(--data-warm)" : "var(--tx-tertiary)",
                    transition: "color 250ms ease",
                  }}
                >
                  {c}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.idx}>
              <td
                className="hero-data-mono"
                style={{ fontSize: 13, color: "var(--tx-secondary)", padding: "5px 0" }}
              >
                {row.idx}
              </td>
              {row.vals.map((v, i) => (
                <td
                  key={i}
                  className="hero-data-mono"
                  style={{
                    fontSize: 13,
                    textAlign: "right",
                    padding: "5px 0",
                    color: valueColor(v),
                    background: i === activeCol ? "var(--ac-subtle)" : "transparent",
                    transition: "background 250ms ease",
                  }}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ height: 1, background: "var(--bg-raised)", margin: "14px 0 10px" }} />
      <div style={{ fontSize: 11, color: "var(--tx-tertiary)" }}>
        MTD · QTD · YTD · 1Y · 3Y ann · 5Y ann — computed from adjusted close via pandas/numpy
      </div>
    </div>
  );
}
