"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { getHistory, HistoryResponse, HistoryPeriod, ReturnRecord } from "../lib/api";

interface TickerDetailDrawerProps {
  ticker: string | null;
  onClose: () => void;
  allTickerData: Record<string, ReturnRecord> | null;
}

const PERIODS: { value: HistoryPeriod; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "3y", label: "3Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "MAX" },
];

type ChartPoint = { date: string; close: number | null; volume: number | null };

// Largest-Triangle-Three-Buckets-style stride downsampling.
// Caps the number of rendered SVG nodes so long periods (1Y+) stay smooth.
const MAX_POINTS = 220;

function downsample(points: ChartPoint[]): ChartPoint[] {
  if (points.length <= MAX_POINTS) return points;
  const stride = points.length / MAX_POINTS;
  const out: ChartPoint[] = [];
  for (let i = 0; i < MAX_POINTS; i++) {
    out.push(points[Math.floor(i * stride)]);
  }
  // Always keep the most recent point so the line ends on the latest price.
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

// Defined at module scope so it isn't re-created on every render.
const CustomChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      className="glass-panel rounded-xl px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)] border-[rgba(255,255,255,0.08)]"
      style={{ background: "rgba(20, 18, 16, 0.9)" }}
    >
      <p className="text-[var(--text-ui-xs)] text-[var(--ink-400)] font-bold uppercase mb-1">
        {item.date}
      </p>
      <p className="type-mono text-[var(--text-ui-md)] font-bold text-[var(--ink-100)]">
        Price: ${item.close?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
      {item.volume && (
        <p className="type-mono text-[var(--text-ui-xs)] text-[var(--ink-400)] mt-0.5">
          Vol: {item.volume.toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default function TickerDetailDrawer({
  ticker,
  onClose,
  allTickerData,
}: TickerDetailDrawerProps) {
  const [period, setPeriod] = useState<HistoryPeriod>("1y");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  // Defer chart mount until the drawer slide-in finishes — rendering hundreds
  // of SVG nodes mid-animation is what causes the visible jank on 1Y+ periods.
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!ticker) return;

    const fetchHist = async () => {
      setLoading(true);
      try {
        const data = await getHistory(ticker, period);
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch ticker history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHist();
  }, [ticker, period]);

  // Reset the deferred chart mount whenever the drawer opens for a new ticker.
  useEffect(() => {
    setChartReady(false);
  }, [ticker]);

  // Memoize + downsample so we don't rebuild the array (and re-render hundreds
  // of SVG nodes) on every parent render.
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!history) return [];
    const points = history.dates.map((date, idx) => ({
      date,
      close: history.close[idx],
      volume: history.volume[idx],
    }));
    return downsample(points);
  }, [history]);

  if (!ticker || !allTickerData || !allTickerData[ticker]) return null;

  const data = allTickerData[ticker];
  const isPos = (data.one_day_return ?? 0) >= 0;

  // Performance guard: disable Recharts animations for large datasets.
  // Animating 1000+ SVG path nodes causes severe jank / lag.
  const isLargeDataset = chartData.length > 120;
  const showVolume = chartData.length <= 250; // skip volume bars on very long periods

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Sliding Drawer Container */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          onAnimationComplete={() => setChartReady(true)}
          className="relative w-full max-w-4xl h-full bg-[var(--ink-950)] border-l border-[rgba(255,255,255,0.06)] shadow-2xl flex flex-col z-10 overflow-y-auto"
          data-lenis-prevent
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.04)] flex justify-between items-start gap-4">
            <div>
              <p className="type-overline mb-1.5">{data.ticker}</p>
              <h2 className="font-serif text-[var(--text-d3)] text-[var(--ink-100)] leading-tight">
                {data.label}
              </h2>
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-[var(--text-d4)] font-bold type-mono text-[var(--ink-100)]">
                  ${data.latest_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-[var(--text-ui-xs)] font-bold type-mono ${
                    isPos
                      ? "text-[var(--positive)] bg-[rgba(101,180,142,0.1)] border border-[rgba(101,180,142,0.2)]"
                      : "text-[var(--negative)] bg-[rgba(224,90,78,0.1)] border border-[rgba(224,90,78,0.2)]"
                  }`}
                >
                  {isPos ? "▲ +" : "▼ "}
                  {data.one_day_return?.toFixed(2)}% (1D)
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] transition-all duration-200 cursor-pointer text-[var(--ink-400)] hover:text-[var(--ink-100)] text-xl"
            >
              ✕
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-6 flex-1 space-y-8">
            {/* Chart Area */}
            <div className="rounded-2xl p-6 glass-panel flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[var(--text-ui-sm)] font-bold uppercase tracking-wider text-[var(--ink-400)]">
                    Price History
                  </h3>
                  {history?.resolution === "weekly" && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold type-mono uppercase tracking-wider bg-[var(--accent-bg)] text-[var(--accent)] border border-[rgba(200,133,58,0.2)]">
                      Weekly
                    </span>
                  )}
                </div>
                {/* Period Selectors */}
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--ink-900)] border border-[rgba(255,255,255,0.04)] w-fit">
                  {PERIODS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      className={`px-3 py-1.5 rounded-md text-[var(--text-ui-xs)] font-bold transition-all duration-200 cursor-pointer ${
                        period === p.value
                          ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                          : "text-[var(--ink-400)] hover:text-[var(--ink-100)]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-t-transparent border-[var(--accent)] rounded-full animate-spin" />
                    <span className="text-[var(--text-ui-sm)] text-[var(--ink-400)] font-semibold">
                      Loading data feed...
                    </span>
                  </div>
                </div>
              ) : chartData.length > 0 && chartReady ? (
                <div className="space-y-4">
                  {/* Price Area Chart */}
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ left: -10, right: 10 }}>
                        <defs>
                          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(72% 0.18 68)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="oklch(72% 0.18 68)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 4"
                          stroke="rgba(255, 255, 255, 0.03)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "oklch(60% 0.007 60)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                          axisLine={false}
                          tickLine={false}
                          dy={6}
                          minTickGap={40}
                        />
                        <YAxis
                          domain={["auto", "auto"]}
                          tick={{ fill: "oklch(60% 0.007 60)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                          axisLine={false}
                          tickLine={false}
                          dx={-6}
                          tickFormatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke="oklch(72% 0.18 68)"
                          strokeWidth={isLargeDataset ? 1.5 : 2}
                          fillOpacity={1}
                          fill="url(#colorClose)"
                          isAnimationActive={!isLargeDataset}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Volume Bar Chart — hidden on very large datasets to prevent lag */}
                  {showVolume && (
                    <div className="h-[70px] w-full opacity-65">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Bar
                            dataKey="volume"
                            fill="var(--ink-700)"
                            radius={[2, 2, 0, 0]}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : chartData.length > 0 ? (
                // Data is loaded but we're waiting for the slide-in to finish.
                <div className="h-[280px] flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-t-transparent border-[var(--accent)] rounded-full animate-spin opacity-60" />
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[var(--ink-400)]">
                  No historical data available.
                </div>
              )}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Returns & CAGRs */}
              <div className="rounded-2xl p-6 glass-panel space-y-4">
                <h4 className="text-[var(--text-ui-sm)] font-bold uppercase tracking-wider text-[var(--accent)] border-b border-[rgba(255,255,255,0.04)] pb-2 mb-4">
                  Performance Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "MTD Return", val: data.mtd },
                    { label: "QTD Return", val: data.qtd },
                    { label: "YTD Return", val: data.ytd },
                    { label: "1-Year Return", val: data["1y"] },
                    { label: "3-Year Ann.", val: data["3y_ann"] },
                    { label: "5-Year Ann.", val: data["5y_ann"] },
                    { label: "CAGR (6Y)", val: data.cagr_full },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-[var(--ink-900)] border border-[rgba(255,255,255,0.02)]">
                      <p className="text-[10px] text-[var(--ink-400)] uppercase font-semibold mb-1">
                        {item.label}
                      </p>
                      {item.val != null ? (
                        <p
                          className={`text-[var(--text-ui-md)] font-bold type-mono ${
                            item.val >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                          }`}
                        >
                          {item.val >= 0 ? "+" : ""}
                          {item.val.toFixed(2)}%
                        </p>
                      ) : (
                        <p className="text-[var(--text-ui-md)] text-[var(--ink-700)] type-mono">—</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Risk & Technicals */}
              <div className="rounded-2xl p-6 glass-panel space-y-4">
                <h4 className="text-[var(--text-ui-sm)] font-bold uppercase tracking-wider text-[var(--accent)] border-b border-[rgba(255,255,255,0.04)] pb-2 mb-4">
                  Risk & Technical Indicators
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "1Y Volatility", val: data.volatility_1y != null ? `${data.volatility_1y.toFixed(2)}%` : "—", desc: "Annualized Standard Deviation" },
                    { label: "Sharpe Ratio (1Y)", val: data.sharpe_1y?.toFixed(2) ?? "—", desc: "Risk-adjusted Return vs. 2% RF" },
                    { label: "Max Drawdown (1Y)", val: data.max_drawdown_1y != null ? `${data.max_drawdown_1y.toFixed(2)}%` : "—", desc: "Peak-to-trough decline over trailing year" },
                    { label: "Calmar Ratio (1Y)", val: data.calmar_1y?.toFixed(2) ?? "—", desc: "Return / Maximum Drawdown ratio" },
                    { label: "Beta vs S&P 500", val: data.beta?.toFixed(3) ?? "—", desc: "Systematic risk/market correlation" },
                    { label: "RSI (14)", val: data.rsi_14?.toFixed(1) ?? "—", desc: "Relative Strength Index momentum" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center p-3 rounded-xl bg-[var(--ink-900)] border border-[rgba(255,255,255,0.02)]">
                      <div>
                        <p className="text-[var(--text-ui-sm)] font-bold text-[var(--ink-100)]">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-[var(--ink-400)] leading-normal mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <span className="type-mono font-bold text-[var(--text-ui-md)] text-[var(--accent)]">
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
