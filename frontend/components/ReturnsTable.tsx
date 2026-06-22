"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { variants } from "../lib/motion";
import { TICKER_ORDER } from "../lib/constants";
import { ReturnRecord } from "../lib/api";

type TabType = "performance" | "technical" | "risk";

interface Column {
  key: keyof ReturnRecord | "52w_range";
  label: string;
  type: "text" | "percentage" | "number" | "rsi" | "range" | "custom";
}

const PERFORMANCE_COLUMNS: Column[] = [
  { key: "mtd", label: "MTD", type: "percentage" },
  { key: "qtd", label: "QTD", type: "percentage" },
  { key: "ytd", label: "YTD", type: "percentage" },
  { key: "1y", label: "1Y", type: "percentage" },
  { key: "3y_ann", label: "3Y ann.", type: "percentage" },
  { key: "5y_ann", label: "5Y ann.", type: "percentage" },
];

const TECHNICAL_COLUMNS: Column[] = [
  { key: "latest_price", label: "Price", type: "number" },
  { key: "52w_range", label: "52W Range (Low / High)", type: "range" },
  { key: "dist_sma_50", label: "vs 50 SMA", type: "percentage" },
  { key: "dist_sma_200", label: "vs 200 SMA", type: "percentage" },
  { key: "rsi_14", label: "RSI (14)", type: "rsi" },
];

const RISK_COLUMNS: Column[] = [
  { key: "volatility_1y", label: "Vol (1Y)", type: "custom" },
  { key: "sharpe_1y", label: "Sharpe (1Y)", type: "custom" },
  { key: "max_drawdown_1y", label: "Max DD (1Y)", type: "percentage" },
  { key: "calmar_1y", label: "Calmar (1Y)", type: "custom" },
  { key: "beta", label: "Beta vs SP500", type: "custom" },
  { key: "cagr_full", label: "CAGR (6Y)", type: "percentage" },
];

function ReturnCell({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="type-mono text-[var(--ink-700)] text-[var(--text-ui-md)]">
        —
      </span>
    );
  }
  const pos = value >= 0;
  return (
    <span
      className={
        pos
          ? "pill-positive type-mono animate-[fade-in_0.3s_ease-out]"
          : "pill-negative type-mono animate-[fade-in_0.3s_ease-out]"
      }
    >
      {pos ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function FormatNumber({ value, decimals = 2, prefix = "", suffix = "" }: { value: number | null; decimals?: number; prefix?: string; suffix?: string }) {
  if (value == null) {
    return <span className="type-mono text-[var(--ink-700)]">—</span>;
  }
  return (
    <span className="type-mono text-[var(--ink-100)] text-[var(--text-ui-md)]">
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function RsiCell({ value }: { value: number | null }) {
  if (value == null) return <span className="type-mono text-[var(--ink-700)]">—</span>;

  let colorClass = "text-[var(--ink-100)] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.10)]";
  if (value >= 70) {
    colorClass = "text-[var(--negative)] bg-[rgba(230,90,78,0.12)] border-[rgba(230,90,78,0.30)]"; // Overbought
  } else if (value <= 30) {
    colorClass = "text-[var(--positive)] bg-[rgba(101,200,142,0.12)] border-[rgba(101,200,142,0.30)]"; // Oversold
  }

  return (
    <span className={`px-2.5 py-1 rounded-md border type-mono font-semibold text-[var(--text-ui-sm)] ${colorClass}`}>
      {value.toFixed(1)}
    </span>
  );
}

function Range52WCell({ row }: { row: ReturnRecord }) {
  const current = row.latest_price;
  const low = row.low_52w;
  const high = row.high_52w;

  if (current == null || low == null || high == null || high === low) {
    return <span className="type-mono text-[var(--ink-700)]">—</span>;
  }

  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100));

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <div className="flex justify-between text-[10px] text-[var(--ink-400)] type-mono">
        <span>{low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="relative w-full h-1.5 rounded-full bg-[var(--ink-800)] overflow-hidden">
        <div
          className="absolute top-0 bottom-0 h-full rounded-full bg-gradient-to-r from-[var(--accent-dim)] to-[var(--accent)]"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 w-1 h-full bg-white opacity-80"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] type-mono mt-0.5">
        <span className="text-[var(--negative)]">Low {row.dist_low_52w != null ? `+${row.dist_low_52w.toFixed(1)}%` : ""}</span>
        <span className="text-[var(--positive)]">High {row.dist_high_52w != null ? `${row.dist_high_52w.toFixed(1)}%` : ""}</span>
      </div>
    </div>
  );
}

export default function ReturnsTable({
  data,
  loading,
  onTickerSelect,
}: {
  data: Record<string, ReturnRecord> | null;
  loading: boolean;
  onTickerSelect?: (ticker: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("performance");
  const [sortKey, setSortKey] = useState<string>("ytd");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Determine current active columns
  const activeColumns =
    activeTab === "performance"
      ? PERFORMANCE_COLUMNS
      : activeTab === "technical"
      ? TECHNICAL_COLUMNS
      : RISK_COLUMNS;

  const toggleSort = (key: string) => {
    if (key === "52w_range") return; // cannot easily sort 52w visual bar directly
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "performance") {
      setSortKey("ytd");
    } else if (tab === "technical") {
      setSortKey("latest_price");
    } else {
      setSortKey("volatility_1y");
    }
    setSortDir("desc");
  };

  const rows = data
    ? Object.values(data).sort((a: any, b: any) => {
        const av = a[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
        const bv = b[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);

        if (av === bv) {
          const idxA = TICKER_ORDER.indexOf(a.ticker);
          const idxB = TICKER_ORDER.indexOf(b.ticker);
          return idxA - idxB;
        }

        return sortDir === "asc" ? av - bv : bv - av;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2 p-1.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] w-fit">
        <button
          onClick={() => changeTab("performance")}
          className={`px-5 py-2.5 rounded-lg text-[var(--text-ui-sm)] font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "performance"
              ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-transparent"
              : "text-[var(--ink-400)] hover:text-[var(--ink-100)]"
          }`}
        >
          Performance Returns
        </button>
        <button
          onClick={() => changeTab("technical")}
          className={`px-5 py-2.5 rounded-lg text-[var(--text-ui-sm)] font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "technical"
              ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-transparent"
              : "text-[var(--ink-400)] hover:text-[var(--ink-100)]"
          }`}
        >
          Technical Indicators
        </button>
        <button
          onClick={() => changeTab("risk")}
          className={`px-5 py-2.5 rounded-lg text-[var(--text-ui-sm)] font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "risk"
              ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-transparent"
              : "text-[var(--ink-400)] hover:text-[var(--ink-100)]"
          }`}
        >
          Risk & Relative Analysis
        </button>
      </div>

      {/* Main Table Grid */}
      <div className="overflow-x-auto rounded-2xl glass-panel">
        <table className="w-full min-w-[850px] border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              {/* Frozen Header for Index */}
              <th className="px-6 py-4 text-left select-none">
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "var(--text-ui-xs)",
                    fontWeight: 600,
                    letterSpacing: "var(--ls-overline)",
                    textTransform: "uppercase",
                    color: "var(--ink-400)",
                  }}
                >
                  Index
                </span>
              </th>

              {/* Dynamic Headers based on activeTab */}
              {activeColumns.map(({ key, label }) => {
                const isSortable = key !== "52w_range";
                return (
                  <th
                    key={key}
                    className={`px-6 py-4 text-left select-none ${isSortable ? "cursor-pointer group" : ""}`}
                    onClick={() => isSortable && toggleSort(key)}
                  >
                    <span
                      className="inline-flex items-center gap-1 transition-colors duration-200"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "var(--text-ui-xs)",
                        fontWeight: 600,
                        letterSpacing: "var(--ls-overline)",
                        textTransform: "uppercase",
                        color: sortKey === key ? "var(--accent)" : "var(--ink-400)",
                      }}
                    >
                      {label}
                      {isSortable && (
                        <span
                          className={`sort-icon text-[11px] ${
                            sortKey === key
                              ? "opacity-100 text-[var(--accent)]"
                              : "opacity-0 group-hover:opacity-40 text-[var(--ink-400)]"
                          }`}
                        >
                          {sortKey === key && sortDir === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 7 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-6 py-5">
                      <div className="h-4 w-28 bg-[var(--ink-800)] rounded animate-pulse" />
                      <div className="h-3 w-12 bg-[var(--ink-800)] rounded animate-pulse mt-2 opacity-50" />
                    </td>
                    {activeColumns.map((c) => (
                      <td key={c.key} className="px-6 py-5">
                        <div className="h-5 w-16 bg-[var(--ink-800)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                rows.map((row: any, i: number) => (
                  <motion.tr
                    key={row.ticker}
                    custom={i}
                    variants={variants.slideLeft(i)}
                    initial="hidden"
                    animate="show"
                    style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}
                    className="returns-table-row transition-all duration-150 group/row cursor-pointer"
                    onClick={() => onTickerSelect?.(row.ticker)}
                  >
                    {/* Index Info Cell */}
                    <td className="px-6 py-4">
                      <div
                        className="group-hover/row:text-[var(--accent)] transition-colors duration-150"
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "var(--text-ui-md)",
                          fontWeight: 600,
                          color: "var(--ink-100)",
                        }}
                      >
                        {row.label}
                      </div>
                      <div
                        className="type-mono mt-0.5 flex items-center gap-1.5"
                        style={{
                          fontSize: "var(--text-ui-xs)",
                          color: "var(--ink-400)",
                          opacity: 0.8,
                        }}
                      >
                        {row.ticker}
                        <span className="opacity-0 group-hover/row:opacity-100 text-[10px] text-[var(--accent)] font-semibold transition-opacity duration-150">
                          (Click for charts)
                        </span>
                      </div>
                    </td>

                    {/* Dynamic Columns rendering */}
                    {activeColumns.map((col) => {
                      const val = row[col.key];

                      return (
                        <td key={col.key} className="px-6 py-4">
                          {col.type === "percentage" && <ReturnCell value={val} />}
                          {col.type === "rsi" && <RsiCell value={val} />}
                          {col.type === "range" && <Range52WCell row={row} />}
                          {col.type === "number" && (
                            <FormatNumber value={val} decimals={2} />
                          )}
                          {col.type === "custom" && (
                            <FormatNumber
                              value={val}
                              decimals={col.key === "beta" ? 3 : 2}
                              suffix={col.key === "volatility_1y" ? "%" : ""}
                            />
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <div className="py-16 text-center text-[var(--text-ui-sm)] text-[var(--ink-400)] font-medium">
            No data. Verify the FastAPI backend is running and reload.
          </div>
        )}
      </div>
    </div>
  );
}
