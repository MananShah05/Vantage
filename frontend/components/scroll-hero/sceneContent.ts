// Storyboard scene map for the scroll-driven hero.
// Frame sequence: 480 frames (frame_0001 → frame_0480) extracted from the 8
// rendered scene videos at 5fps. Scene boundaries below are expressed as
// normalized scroll progress [0,1] and line up with the cut points between the
// source clips (PROMPT 01 … PROMPT 08).
//
// Copy follows the typography anti-patterns in implementation.md:
// no em dashes (commas / colons / parentheses only), no gradient text.

export const FRAME_COUNT = 480;

export type SceneKey =
  | "hero"
  | "pm"
  | "ingest"
  | "period"
  | "table"
  | "resilient"
  | "execution"
  | "cta";

export interface SceneDef {
  key: SceneKey;
  start: number; // inclusive
  end: number; // exclusive
  /** Top-left section label, e.g. "FEATURE 01 · DATA INGESTION". null = hidden. */
  label: string | null;
  /** PM speech bubble copy (bottom-right). null = hidden. */
  speech: string | null;
}

export const SCENES: SceneDef[] = [
  { key: "hero", start: 0.0, end: 0.1, label: null, speech: null },
  {
    key: "pm",
    start: 0.1,
    end: 0.25,
    label: "MEET MANAN",
    speech:
      "I'm Manan. Every month I rebuild this report by hand. Let me show you what Vantage does instead.",
  },
  {
    key: "ingest",
    start: 0.25,
    end: 0.39,
    label: "FEATURE 01 · DATA INGESTION",
    speech:
      "Yahoo Finance. Seven liquid indices. The backend fetches them per request, no stale database, no manual CSV downloads. If one fails, the others still return.",
  },
  {
    key: "period",
    start: 0.39,
    end: 0.53,
    label: "FEATURE 02 · PERIOD MATH",
    speech:
      "MTD, QTD, YTD, 1Y, plus annualised 3Y and 5Y. Null when history is too short. The math runs server-side, every time.",
  },
  {
    key: "table",
    start: 0.53,
    end: 0.66,
    label: "FEATURE 03 · INTERACTIVE REPORT",
    speech:
      "Sortable by any column. Click MTD and it re-ranks instantly. Color tells you at a glance.",
  },
  {
    key: "resilient",
    start: 0.66,
    end: 0.78,
    label: "FEATURE 04 · RESILIENT LOADING",
    speech:
      "If Yahoo Finance drops one symbol, the other six still return. Skeleton rows while it loads, inline retry on error, never a blank screen.",
  },
  {
    key: "execution",
    start: 0.78,
    end: 0.91,
    label: "EXECUTION",
    speech:
      "Month closes. I open Vantage. Returns are there. I write the commentary. Client material ships. That's the only workflow now.",
  },
  { key: "cta", start: 0.91, end: 1.01, label: null, speech: null },
];

export function sceneIndexForProgress(p: number): number {
  for (let i = 0; i < SCENES.length; i++) {
    if (p >= SCENES[i].start && p < SCENES[i].end) return i;
  }
  return SCENES.length - 1;
}

export const TICKERS = [
  "^GSPC",
  "EFA",
  "EEM",
  "AGG",
  "VNQ",
  "GLD",
  "DX-Y.NYB",
];

export const TICKER_TAPE = [
  { label: "S&P 500", value: "+2.14%", positive: true },
  { label: "MSCI EAFE", value: "-0.87%", positive: false },
  { label: "MSCI EM", value: "+1.42%", positive: true },
  { label: "US Agg Bond", value: "-0.31%", positive: false },
  { label: "US REITs", value: "+0.96%", positive: true },
  { label: "Gold", value: "+4.32%", positive: true },
  { label: "DXY", value: "-1.08%", positive: false },
];

export const PERIOD_DEFS: { label: string; def: string }[] = [
  { label: "MTD", def: "start of month to latest close" },
  { label: "QTD", def: "start of quarter to latest close" },
  { label: "YTD", def: "Dec 31 prior year to latest close" },
  { label: "1Y", def: "same date one year prior" },
  { label: "3Y ann.", def: "(end / start) ^ (1/3) − 1" },
  { label: "5Y ann.", def: "(end / start) ^ (1/5) − 1" },
];
