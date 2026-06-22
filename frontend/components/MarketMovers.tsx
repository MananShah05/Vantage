"use client";

import { useEffect, useState } from "react";
import { getMovers, MoverEntry, MoverPeriod } from "../lib/api";

export default function MarketMovers() {
  const [period, setPeriod] = useState<MoverPeriod>("1d");
  const [data, setData] = useState<{ gainers: MoverEntry[]; losers: MoverEntry[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovers = async () => {
      setLoading(true);
      try {
        const res = await getMovers(3, period);
        setData(res);
      } catch (err) {
        console.error("Failed to load market movers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovers();
  }, [period]);

  const periodLabels: Record<MoverPeriod, string> = {
    "1d": "1-Day Return",
    mtd: "MTD",
    qtd: "QTD",
    ytd: "YTD",
    "1y": "1-Year",
  };

  return (
    <div className="rounded-2xl p-6 glass-panel flex flex-col h-full justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="type-overline mb-1">Momentum</p>
            <h3 className="font-serif text-[var(--text-d4)] text-[var(--ink-100)]">
              Market Movers
            </h3>
          </div>
          
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as MoverPeriod)}
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
          <div className="space-y-4 py-8">
            <div className="h-6 w-full bg-[var(--ink-800)] rounded animate-pulse" />
            <div className="h-6 w-full bg-[var(--ink-800)] rounded animate-pulse" />
            <div className="h-6 w-full bg-[var(--ink-800)] rounded animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gainers */}
            <div className="space-y-3">
              <h4 className="text-[var(--text-ui-xs)] uppercase tracking-wider text-[var(--positive)] font-bold flex items-center gap-1">
                ▲ Top Gainers
              </h4>
              <div className="space-y-2">
                {data?.gainers.map((g) => (
                  <div
                    key={g.ticker}
                    className="flex justify-between items-center p-3 rounded-xl bg-[rgba(101,180,142,0.02)] border border-[rgba(101,180,142,0.06)] hover:bg-[rgba(101,180,142,0.04)] transition-all duration-200"
                  >
                    <div>
                      <p className="text-[var(--text-ui-sm)] font-bold text-[var(--ink-100)]">
                        {g.label.replace("(ETF proxy)", "").trim()}
                      </p>
                      <p className="text-[10px] text-[var(--ink-400)] type-mono uppercase">
                        {g.ticker}
                      </p>
                    </div>
                    <span className="type-mono font-bold text-[var(--text-ui-sm)] text-[var(--positive)]">
                      +{g.return.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div className="space-y-3">
              <h4 className="text-[var(--text-ui-xs)] uppercase tracking-wider text-[var(--negative)] font-bold flex items-center gap-1">
                ▼ Top Losers
              </h4>
              <div className="space-y-2">
                {data?.losers.map((l) => (
                  <div
                    key={l.ticker}
                    className="flex justify-between items-center p-3 rounded-xl bg-[rgba(224,90,78,0.02)] border border-[rgba(224,90,78,0.06)] hover:bg-[rgba(224,90,78,0.04)] transition-all duration-200"
                  >
                    <div>
                      <p className="text-[var(--text-ui-sm)] font-bold text-[var(--ink-100)]">
                        {l.label.replace("(ETF proxy)", "").trim()}
                      </p>
                      <p className="text-[10px] text-[var(--ink-400)] type-mono uppercase">
                        {l.ticker}
                      </p>
                    </div>
                    <span className="type-mono font-bold text-[var(--text-ui-sm)] text-[var(--negative)]">
                      {l.return.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
