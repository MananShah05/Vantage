import axios from "axios";
import { API_URL, API_TIMEOUT } from "./config";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReturnRecord {
  ticker: string;
  label: string;
  latest_price: number;
  latest_date: string;
  // Period returns
  mtd: number | null;
  qtd: number | null;
  ytd: number | null;
  "1y": number | null;
  "3y_ann": number | null;
  "5y_ann": number | null;
  // Risk / momentum
  one_day_return: number | null;
  volatility_1y: number | null;
  sharpe_1y: number | null;
  max_drawdown_1y: number | null;
  calmar_1y: number | null;
  // Technical
  dist_sma_50: number | null;
  dist_sma_200: number | null;
  high_52w: number | null;
  low_52w: number | null;
  dist_high_52w: number | null;
  dist_low_52w: number | null;
  rsi_14: number | null;
  // Relative / long-run
  beta: number | null;
  cagr_full: number | null;
}

export interface ReturnsResponse {
  data: Record<string, ReturnRecord>;
  cached_ttl_s?: number;
}

export interface SingleReturnResponse {
  data: ReturnRecord;
}

export interface TickerInfo {
  ticker: string;
  label: string;
}

export interface TickersResponse {
  tickers: TickerInfo[];
  periods: string[];
  count: number;
}

export interface HistoryResponse {
  ticker: string;
  label: string;
  period: string;
  resolution?: "daily" | "weekly";
  dates: string[];
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
  count: number;
}

export interface CompareSeries {
  label: string;
  values: (number | null)[];
}

export interface CompareResponse {
  period: string;
  base: number;
  dates: string[];
  series: Record<string, CompareSeries>;
  tickers: string[];
}

export interface CorrelationResponse {
  period: string;
  tickers: string[];
  labels: Record<string, string>;
  matrix: number[][];
}

export interface MoverEntry {
  ticker: string;
  label: string;
  return: number;
}

export interface MoversResponse {
  period: string;
  gainers: MoverEntry[];
  losers: MoverEntry[];
  all: MoverEntry[];
}

export type HistoryPeriod = "1m" | "3m" | "6m" | "1y" | "3y" | "5y" | "max";
export type MoverPeriod = "1d" | "mtd" | "qtd" | "ytd" | "1y";

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch all available tickers and supported periods. */
export const getTickers = async (): Promise<TickersResponse> => {
  const { data } = await api.get<TickersResponse>("/api/tickers");
  return data;
};

/** Fetch computed returns + metrics for ALL tickers. */
export const getReturns = async (): Promise<ReturnsResponse> => {
  const { data } = await api.get<ReturnsResponse>("/api/returns");
  return data;
};

/** Fetch computed returns + metrics for a single ticker. */
export const getSingleReturn = async (ticker: string): Promise<SingleReturnResponse> => {
  const { data } = await api.get<SingleReturnResponse>(`/api/returns/${ticker}`);
  return data;
};

/** Fetch OHLCV history for a single ticker over a given period. */
export const getHistory = async (
  ticker: string,
  period: HistoryPeriod = "1y",
): Promise<HistoryResponse> => {
  const { data } = await api.get<HistoryResponse>(`/api/history/${ticker}`, {
    params: { period },
  });
  return data;
};

/**
 * Fetch normalised (rebased to 100) close prices for multiple tickers.
 * Pass tickers as an array; they will be joined to a comma-separated string.
 */
export const compareTickets = async (
  tickers: string[],
  period: HistoryPeriod = "1y",
): Promise<CompareResponse> => {
  const { data } = await api.get<CompareResponse>("/api/compare", {
    params: { tickers: tickers.join(","), period },
  });
  return data;
};

/** Fetch the Pearson correlation matrix of daily returns for all tickers. */
export const getCorrelation = async (
  period: HistoryPeriod = "1y",
): Promise<CorrelationResponse> => {
  const { data } = await api.get<CorrelationResponse>("/api/correlation", {
    params: { period },
  });
  return data;
};

/** Fetch top N gainers and bottom N losers for a given period. */
export const getMovers = async (
  n: number = 3,
  period: MoverPeriod = "1d",
): Promise<MoversResponse> => {
  const { data } = await api.get<MoversResponse>("/api/movers", {
    params: { n, period },
  });
  return data;
};
