"use client";

import { useEffect, useState } from "react";
import { getCorrelation, CorrelationResponse, HistoryPeriod } from "../lib/api";

export default function CorrelationMatrix() {
  const [period, setPeriod] = useState<HistoryPeriod>("1y");
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCorrelation = async () => {
      setLoading(true);
      try {
        const res = await getCorrelation(period);
        setData(res);
      } catch (err) {
        console.error("Failed to load correlation matrix:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCorrelation();
  }, [period]);

  const getHeatmapStyle = (value: number) => {
    // Pearson correlation ranges from -1 to 1.
    const absVal = Math.abs(value);
    if (value > 0.05) {
      // Positive correlation: green — ensure text is bright enough
      const bgOpacity = Math.max(0.08, absVal * 0.45);
      return {
        backgroundColor: `rgba(101, 200, 142, ${bgOpacity})`,
        color: absVal > 0.4 ? "var(--positive)" : "oklch(72% 0.19 142)",
      };
    } else if (value < -0.05) {
      // Negative correlation: red
      const bgOpacity = Math.max(0.08, absVal * 0.45);
      return {
        backgroundColor: `rgba(230, 90, 78, ${bgOpacity})`,
        color: absVal > 0.4 ? "var(--negative)" : "oklch(68% 0.22 22)",
      };
    }
    return {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      color: "var(--ink-200)",
    };
  };

  const periodLabels: Record<Extract<HistoryPeriod, "3m" | "6m" | "1y" | "3y" | "5y">, string> = {
    "3m": "3-Month",
    "6m": "6-Month",
    "1y": "1-Year",
    "3y": "3-Year",
    "5y": "5-Year",
  };

  const shortenTicker = (t: string) => {
    return t.replace("-Y.NYB", "").replace("^GSPC", "SPX");
  };

  return (
    <div className="rounded-2xl p-6 glass-panel flex flex-col h-full justify-between w-full">
      <div className="w-full">
        {/* Title and period selector */}
        <div className="flex justify-between items-center mb-6 gap-2">
          <div>
            <p className="type-overline mb-1">Asset Allocation</p>
            <h3 className="font-serif text-[var(--text-d4)] text-[var(--ink-100)]">
              Correlation Matrix
            </h3>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as HistoryPeriod)}
            className="px-3 py-1.5 rounded-lg bg-[var(--ink-900)] border border-[rgba(255,255,255,0.06)] text-[var(--text-ui-sm)] text-[var(--ink-200)] font-semibold outline-none cursor-pointer focus:border-[var(--accent)] transition-all duration-200"
          >
            {Object.entries(periodLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-4 py-12">
            <div className="h-6 w-full bg-[var(--ink-800)] rounded animate-pulse" />
            <div className="h-6 w-full bg-[var(--ink-800)] rounded animate-pulse" />
            <div className="h-6 w-full bg-[var(--ink-800)] rounded animate-pulse" />
          </div>
        ) : data ? (
          <div className="w-full">
            {/* Grid Header Labels */}
            <div className="grid grid-cols-8 gap-0.5 sm:gap-1 mb-1">
              <div className="h-7 sm:h-8" /> {/* Top left corner spacer */}
              {data.tickers.map((t) => (
                <div
                  key={t}
                  title={data.labels[t] || t}
                  className="h-7 sm:h-8 flex items-center justify-center text-[9px] xs:text-[10px] sm:text-xs font-bold text-[var(--ink-200)] text-center select-none uppercase truncate px-0.5"
                >
                  {shortenTicker(t)}
                </div>
              ))}
            </div>

            {/* Rows */}
            {data.tickers.map((rowTicker, rowIdx) => (
              <div key={rowTicker} className="grid grid-cols-8 gap-0.5 sm:gap-1 mb-1 items-center">
                {/* Row Name Label */}
                <div
                  title={data.labels[rowTicker] || rowTicker}
                  className="h-8 sm:h-9 flex items-center justify-start text-[9px] xs:text-[10px] sm:text-xs font-bold text-[var(--ink-200)] select-none uppercase truncate pr-1 sm:pr-2"
                >
                  {shortenTicker(rowTicker)}
                </div>

                {/* Matrix Cells */}
                {data.tickers.map((colTicker, colIdx) => {
                  const val = data.matrix[rowIdx][colIdx];
                  const style = getHeatmapStyle(val);
                  return (
                    <div
                      key={colTicker}
                      style={style}
                      title={`${rowTicker} vs ${colTicker}: ${val}`}
                      className="h-8 sm:h-9 rounded-md flex items-center justify-center text-[9px] xs:text-[10px] sm:text-xs font-semibold type-mono transition-all duration-200 select-none border border-[rgba(255,255,255,0.02)]"
                    >
                      {val.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-[var(--ink-400)]">Failed to render correlation map.</div>
        )}
      </div>
    </div>
  );
}
