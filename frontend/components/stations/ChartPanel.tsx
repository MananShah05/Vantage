"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATA = [
  { m: "Jan", SPY: 2.1, QQQ: 3.4, EEM: -0.6 },
  { m: "Feb", SPY: 3.0, QQQ: 5.1, EEM: -1.2 },
  { m: "Mar", SPY: 4.4, QQQ: 6.0, EEM: 0.4 },
  { m: "Apr", SPY: 5.2, QQQ: 8.7, EEM: 1.1 },
  { m: "May", SPY: 6.8, QQQ: 10.2, EEM: 0.2 },
  { m: "Jun", SPY: 8.4, QQQ: 12.3, EEM: -2.1 },
];

const SERIES = [
  { key: "SPY", color: "oklch(0.68 0.14 155)" },
  { key: "QQQ", color: "oklch(0.73 0.17 165)" },
  { key: "EEM", color: "oklch(0.60 0.18 25)" },
];

export default function ChartPanel() {
  return (
    <div
      style={{
        width: 520,
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-raised)",
        borderRadius: 10,
        padding: "18px 20px",
        color: "var(--tx-primary)",
        fontFamily: "var(--font-inter)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="hero-label" style={{ color: "var(--tx-secondary)" }}>
          Performance Comparison
        </span>
        <span style={{ display: "flex", gap: 12 }}>
          {SERIES.map((s) => (
            <span
              key={s.key}
              className="hero-data-mono"
              style={{ fontSize: 11, color: s.color, display: "inline-flex", gap: 4, alignItems: "center" }}
            >
              <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} />
              {s.key}
            </span>
          ))}
        </span>
      </div>

      <div style={{ height: 200, marginTop: 14 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--bg-raised)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="m"
              tick={{ fill: "var(--tx-tertiary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--bg-raised)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--tx-tertiary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-raised)",
                border: "1px solid var(--bg-surface)",
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--tx-secondary)" }}
              cursor={{ stroke: "var(--ac-primary)", strokeOpacity: 0.3 }}
            />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                animationDuration={1400}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 11, color: "var(--tx-tertiary)", marginTop: 8 }}>
        Recharts · responsive · tooltip on hover · cross-index comparison
      </div>
    </div>
  );
}
