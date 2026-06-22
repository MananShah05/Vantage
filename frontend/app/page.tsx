"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ReturnsTable from "../components/ReturnsTable";
import MarketChart from "../components/MarketChart";
import MarketMovers from "../components/MarketMovers";
import CorrelationMatrix from "../components/CorrelationMatrix";
import TickerDetailDrawer from "../components/TickerDetailDrawer";
import { getReturns, ReturnRecord } from "../lib/api";

// Frame-sequence scroll hero is client-only (canvas + scroll math).
const ScrollHero = dynamic(() => import("../components/scroll-hero/ScrollHero"), {
  ssr: false,
});

export default function Home() {
  const [returns, setReturns] = useState<Record<string, ReturnRecord> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReturns();
      setReturns(data.data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to resolve live index returns feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--ink-950)] text-[var(--ink-100)] pb-20">
      {/* Scroll-driven pre-rendered animation hero */}
      <ScrollHero />

      {/* Live returns reporting section */}
      <section
        id="report"
        className="relative py-28 px-4 sm:px-8 md:px-16 lg:px-24 max-w-7xl mx-auto z-10 space-y-24"
      >
        {/* Section Header */}
        <div data-aos="fade-up">
          <p className="type-overline mb-2">Live Report</p>
          <h2 className="type-d2 mb-4" style={{ color: "var(--ink-100)" }}>
            Market Intelligence
          </h2>
          <p
            className="type-body"
            style={{ color: "var(--ink-400)", fontSize: "var(--text-ui-xl)", maxWidth: "48ch" }}
          >
            Real-time multi-period returns, volatility analytics, momentum triggers, and technical indicators computed on-demand.
          </p>
        </div>

        {/* Dynamic Error State Notification */}
        {error && (
          <div
            className="rounded-2xl p-6 glass-panel border-[rgba(224,90,78,0.25)] bg-[rgba(224,90,78,0.03)] animate-[fade-in_0.3s_ease-out]"
            data-aos="fade-up"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(224,90,78,0.15)] text-[var(--negative)] font-bold text-sm">
                  !
                </div>
                <div>
                  <p className="text-[var(--text-ui-md)] font-semibold text-[var(--negative)]">
                    Connection Error
                  </p>
                  <p className="text-[var(--text-ui-sm)] text-[var(--ink-400)] mt-0.5">
                    {error} Check if your server or internet connection is online.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchReturns}
                className="glow-btn px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[var(--ink-100)] text-[var(--text-ui-sm)] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200 cursor-pointer self-stretch sm:self-auto text-center"
              >
                Retry Fetch
              </button>
            </div>
          </div>
        )}

        {/* Interactive Returns Table */}
        <div data-aos="fade-up">
          <ReturnsTable
            data={returns}
            loading={loading}
            onTickerSelect={(ticker) => setSelectedTicker(ticker)}
          />
        </div>

        {/* Analytics Grid: Movers & Correlation Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-aos="fade-up">
          <MarketMovers />
          <CorrelationMatrix />
        </div>

        {/* YTD Performance Chart */}
        {returns && (
          <div data-aos="fade-up">
            <div className="mb-10">
              <p className="type-overline mb-2">Performance Chart</p>
              <h3 className="type-d3 mb-4" style={{ color: "var(--ink-100)" }}>
                YTD Comparison
              </h3>
              <p
                className="type-body"
                style={{ color: "var(--ink-400)", fontSize: "var(--text-ui-xl)", maxWidth: "48ch" }}
              >
                Visual comparison of year-to-date returns to identify performance dispersion
                across primary benchmarks.
              </p>
            </div>
            <MarketChart data={returns} />
          </div>
        )}
      </section>

      {/* Styled Institutional Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--ink-800)",
          padding: "3.5rem 2rem",
          marginTop: "6rem",
          background: "oklch(10% 0.008 60 / 0.3)",
        }}
        className="relative z-10"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              style={{ background: "var(--accent-bg)", border: "1px solid oklch(72% 0.18 68 / 0.2)" }}
              className="w-6 h-6 rounded-md flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 11L4 6l3 2 3-5 3 2"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "var(--text-ui-md)",
                fontWeight: 600,
                color: "var(--ink-100)",
              }}
            >
              Vantage
            </span>
          </div>

          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "var(--text-ui-sm)",
              color: "var(--ink-400)",
              maxWidth: "55ch",
            }}
            className="text-center md:text-right leading-relaxed"
          >
            Sourced via Yahoo Finance API. All calculations are executed server-side.
            For informational purposes only. This report does not constitute investment advice.
          </p>
        </div>
        <div className="max-w-7xl mx-auto border-t border-[rgba(255,255,255,0.05)] mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[var(--ink-500)] text-[var(--text-ui-xs)]">
          <p>© 2026 Vantage Technologies Inc. All rights reserved.</p>
          <p>Institutional Market Intelligence Platform</p>
        </div>
      </footer>

      {/* Drawer Overlay */}
      <TickerDetailDrawer
        ticker={selectedTicker}
        onClose={() => setSelectedTicker(null)}
        allTickerData={returns}
      />
    </main>
  );
}
