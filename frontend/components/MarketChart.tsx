"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { ReturnRecord } from "../lib/api";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val: number = payload[0].value;
  return (
    <div
      className="glass-panel rounded-xl px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
      style={{ background: "rgba(20, 18, 16, 0.85)" }}
    >
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "var(--text-ui-md)",
          fontWeight: 600,
          color: "var(--ink-100)",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p
        className="type-mono"
        style={{
          fontWeight: 600,
          fontSize: "var(--text-ui-md)",
          color: val >= 0 ? "var(--positive)" : "var(--negative)",
        }}
      >
        YTD: {val >= 0 ? "+" : ""}{val.toFixed(2)}%
      </p>
    </div>
  );
};

export default function MarketChart({ data }: { data: Record<string, ReturnRecord> }) {
  const chartData = Object.values(data)
    .filter((d: ReturnRecord) => d.ytd != null)
    .map((d: ReturnRecord) => ({
      name: d.label?.replace("(ETF proxy)", "").trim() ?? d.ticker,
      ytd: d.ytd as number,
    }))
    .sort((a, b) => b.ytd - a.ytd);

  return (
    <div className="rounded-2xl p-8 glass-panel">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 10, left: 0, bottom: 0 }}
          barSize={40}
        >
          <defs>
            <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(65% 0.18 142)" stopOpacity={0.85} />
              <stop offset="100%" stopColor="oklch(65% 0.18 142)" stopOpacity={0.12} />
            </linearGradient>
            <linearGradient id="negGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(62% 0.2 22)" stopOpacity={0.85} />
              <stop offset="100%" stopColor="oklch(62% 0.2 22)" stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(255, 255, 255, 0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "oklch(65% 0.007 60)", fontSize: 11, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "oklch(60% 0.007 60)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
            animationDuration={150}
          />
          <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" strokeWidth={1.5} />
          <Bar dataKey="ytd" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.ytd >= 0 ? "url(#posGradient)" : "url(#negGradient)"}
                stroke={entry.ytd >= 0 ? "oklch(65% 0.18 142 / 0.5)" : "oklch(62% 0.2 22 / 0.5)"}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
