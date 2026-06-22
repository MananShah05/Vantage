import pandas as pd
import numpy as np
from datetime import datetime, date
from data_fetch import get_ticker_labels


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _pct(start_val: float, end_val: float) -> float | None:
    if not start_val or np.isnan(start_val) or np.isnan(end_val):
        return None
    return round((end_val / start_val - 1) * 100, 2)


def _annualise(total_return_pct: float, years: float) -> float | None:
    if total_return_pct is None or years <= 0:
        return None
    r = total_return_pct / 100
    return round(((1 + r) ** (1 / years) - 1) * 100, 2)


def _nearest_price(series: pd.Series, target_date: date) -> float | None:
    ts = pd.Timestamp(target_date)
    subset = series[series.index <= ts]
    if subset.empty:
        return None
    return float(subset.iloc[-1])


def _rsi(series: pd.Series, window: int = 14) -> float | None:
    """Wilder-smoothed RSI (classic formula). Returns the latest RSI value."""
    if len(series) < window + 1:
        return None
    delta = series.diff().dropna()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=window - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=window - 1, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    val = float(rsi.iloc[-1])
    return round(val, 2) if not np.isnan(val) else None


def _beta(asset_returns: pd.Series, market_returns: pd.Series) -> float | None:
    """Beta of *asset* against *market* over the shared date range."""
    combined = pd.concat([asset_returns, market_returns], axis=1).dropna()
    if len(combined) < 30:
        return None
    cov = combined.iloc[:, 0].cov(combined.iloc[:, 1])
    var = combined.iloc[:, 1].var()
    if var == 0:
        return None
    return round(cov / var, 3)


# ---------------------------------------------------------------------------
# Core computation
# ---------------------------------------------------------------------------

def compute_returns_for_series(
    series: pd.Series,
    market_series: pd.Series | None = None,
) -> dict:
    """
    Compute all return metrics for a single price series.

    Parameters
    ----------
    series : pd.Series
        Daily close prices indexed by pd.Timestamp.
    market_series : pd.Series | None
        Optional S&P 500 daily closes for beta computation.
    """
    if series.empty:
        return {}

    today = datetime.today().date()
    latest = float(series.iloc[-1])
    q = (today.month - 1) // 3

    starts = {
        "mtd": date(today.year, today.month, 1),
        "qtd": date(today.year, q * 3 + 1, 1),
        "ytd": date(today.year, 1, 1),
        "1y":  date(today.year - 1, today.month, today.day),
        "3y":  date(today.year - 3, today.month, today.day),
        "5y":  date(today.year - 5, today.month, today.day),
    }

    def ret(key):
        p = _nearest_price(series, starts[key])
        return _pct(p, latest) if p else None

    # ── 1-year window ──────────────────────────────────────────────────────
    one_year_ago = series.index[-1] - pd.Timedelta(days=365)
    series_1y = series[series.index >= one_year_ago]

    # 52-week high / low
    high_52w = float(series_1y.max()) if not series_1y.empty else None
    low_52w  = float(series_1y.min()) if not series_1y.empty else None
    dist_high_52w = float(round(((latest / high_52w) - 1.0) * 100, 2)) if high_52w else None
    dist_low_52w  = float(round(((latest / low_52w)  - 1.0) * 100, 2)) if low_52w  else None

    # Volatility 1y (annualised σ of daily returns)
    daily_returns = series_1y.pct_change().dropna()
    if len(daily_returns) >= 30:
        vol_1y = float(round(daily_returns.std() * np.sqrt(252) * 100, 2))
    else:
        vol_1y = None

    # Sharpe 1y (2 % risk-free)
    ret_1y = ret("1y")
    if ret_1y is not None and vol_1y is not None and vol_1y > 0:
        sharpe_1y = float(round((ret_1y - 2.0) / vol_1y, 2))
    else:
        sharpe_1y = None

    # Max drawdown 1y
    if not series_1y.empty:
        roll_max  = series_1y.cummax()
        drawdowns = (series_1y / roll_max) - 1.0
        max_dd_1y = float(round(drawdowns.min() * 100, 2))
    else:
        max_dd_1y = None

    # SMA 50 / 200
    dist_sma_50  = None
    dist_sma_200 = None
    if len(series) >= 50:
        sma50 = series.rolling(50).mean().iloc[-1]
        dist_sma_50 = float(round(((latest / sma50) - 1.0) * 100, 2))
    if len(series) >= 200:
        sma200 = series.rolling(200).mean().iloc[-1]
        dist_sma_200 = float(round(((latest / sma200) - 1.0) * 100, 2))

    # One-day return
    if len(series) >= 2:
        one_day_return = float(round(((latest / float(series.iloc[-2])) - 1.0) * 100, 2))
    else:
        one_day_return = None

    # ── NEW: RSI-14 ────────────────────────────────────────────────────────
    rsi_14 = _rsi(series_1y)

    # ── NEW: Beta vs market ────────────────────────────────────────────────
    beta = None
    if market_series is not None and not market_series.empty:
        mkt_1y = market_series[market_series.index >= one_year_ago]
        asset_ret = series_1y.pct_change().dropna()
        market_ret = mkt_1y.pct_change().dropna()
        beta = _beta(asset_ret, market_ret)

    # ── NEW: Calmar ratio (1y) ─────────────────────────────────────────────
    # Calmar = annualised_return / |max_drawdown|
    calmar_1y = None
    if ret_1y is not None and max_dd_1y is not None and max_dd_1y != 0:
        calmar_1y = float(round(ret_1y / abs(max_dd_1y), 3))

    # ── NEW: Full-history CAGR ─────────────────────────────────────────────
    cagr_full = None
    if len(series) >= 252:  # need at least ~1 year
        first_price = float(series.iloc[0])
        years_total = (series.index[-1] - series.index[0]).days / 365.25
        if first_price > 0 and years_total > 0:
            cagr_full = float(round(((latest / first_price) ** (1 / years_total) - 1) * 100, 2))

    return {
        "latest_price":   latest,
        "latest_date":    series.index[-1].strftime("%Y-%m-%d"),
        # Period returns
        "mtd":            ret("mtd"),
        "qtd":            ret("qtd"),
        "ytd":            ret("ytd"),
        "1y":             ret_1y,
        "3y_ann":         _annualise(ret("3y"), 3),
        "5y_ann":         _annualise(ret("5y"), 5),
        # Risk / momentum
        "one_day_return": one_day_return,
        "volatility_1y":  vol_1y,
        "sharpe_1y":      sharpe_1y,
        "max_drawdown_1y": max_dd_1y,
        "calmar_1y":      calmar_1y,
        # Technical
        "dist_sma_50":    dist_sma_50,
        "dist_sma_200":   dist_sma_200,
        "high_52w":       high_52w,
        "low_52w":        low_52w,
        "dist_high_52w":  dist_high_52w,
        "dist_low_52w":   dist_low_52w,
        "rsi_14":         rsi_14,
        # Relative
        "beta":           beta,
        # Long-run
        "cagr_full":      cagr_full,
    }


def compute_all_returns(
    raw: dict[str, pd.Series],
    market_ticker: str = "^GSPC",
) -> dict[str, dict]:
    labels = get_ticker_labels()
    market_series = raw.get(market_ticker)
    output = {}
    for ticker, series in raw.items():
        # Don't compute beta against itself
        mkt = market_series if ticker != market_ticker else None
        r = compute_returns_for_series(series, market_series=mkt)
        r["label"]  = labels.get(ticker, ticker)
        r["ticker"] = ticker
        output[ticker] = r
    return output
