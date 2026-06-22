import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

DEFAULT_TICKERS: dict[str, str] = {
    "^GSPC":    "S&P 500",
    "EFA":      "MSCI EAFE (ETF proxy)",
    "EEM":      "MSCI EM (ETF proxy)",
    "AGG":      "US Agg Bond",
    "VNQ":      "US REITs",
    "GLD":      "Gold",
    "DX-Y.NYB": "US Dollar Index (DXY)",
}

LOOKBACK_YEARS = 6

# Map friendly period names to approximate lookback days
PERIOD_DAYS: dict[str, int] = {
    "1m":  30,
    "3m":  90,
    "6m":  180,
    "1y":  365,
    "3y":  365 * 3,
    "5y":  365 * 5,
    "max": 365 * LOOKBACK_YEARS,
}


def fetch_all_data(tickers: list[str] | None = None) -> dict[str, pd.Series]:
    """Return a dict of {ticker: Close price Series} for the full lookback window."""
    if tickers is None:
        tickers = list(DEFAULT_TICKERS.keys())

    end   = datetime.today()
    start = end - timedelta(days=365 * LOOKBACK_YEARS)
    result: dict[str, pd.Series] = {}

    for ticker in tickers:
        try:
            df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
            if df.empty:
                continue
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            series = df["Close"].squeeze()
            series.name = ticker
            result[ticker] = series
        except Exception as e:
            print(f"[ERROR] {ticker}: {e}")

    return result


def fetch_history(
    ticker: str,
    period: str = "1y",
) -> pd.DataFrame | None:
    """
    Return a DataFrame with columns [Open, High, Low, Close, Volume] for a
    single ticker over the requested period.

    Period choices: 1m, 3m, 6m, 1y, 3y, 5y, max
    """
    days = PERIOD_DAYS.get(period, PERIOD_DAYS["1y"])
    end   = datetime.today()
    start = end - timedelta(days=days)
    try:
        df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
        if df.empty:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        # Keep only OHLCV columns that are present
        cols = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in df.columns]
        return df[cols]
    except Exception as e:
        print(f"[ERROR] fetch_history({ticker}, {period}): {e}")
        return None


def fetch_correlation_data(
    tickers: list[str] | None = None,
    period: str = "1y",
) -> dict[str, pd.Series]:
    """Return {ticker: daily_return_Series} over the chosen period."""
    if tickers is None:
        tickers = list(DEFAULT_TICKERS.keys())
    days  = PERIOD_DAYS.get(period, PERIOD_DAYS["1y"])
    end   = datetime.today()
    start = end - timedelta(days=days)
    result: dict[str, pd.Series] = {}
    for ticker in tickers:
        try:
            df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
            if df.empty:
                continue
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            series = df["Close"].squeeze().pct_change().dropna()
            series.name = ticker
            result[ticker] = series
        except Exception as e:
            print(f"[ERROR] fetch_correlation_data({ticker}): {e}")
    return result


def get_ticker_labels() -> dict[str, str]:
    return DEFAULT_TICKERS
