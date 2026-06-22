import os
import re
import time
import logging
from typing import Literal

import numpy as np
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from cache import returns_cache, history_cache
from data_fetch import (
    fetch_all_data,
    fetch_history,
    fetch_correlation_data,
    get_ticker_labels,
    DEFAULT_TICKERS,
    PERIOD_DAYS,
)
from compute_returns import compute_all_returns

logger = logging.getLogger("uvicorn.error")

# ── Config ─────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else []
)
IS_DEV = os.getenv("ENV", "production").lower() == "development"
ALLOWED_TICKERS: set[str] = set(DEFAULT_TICKERS.keys())
_TICKER_RE = re.compile(r"^[\w\.\-\^]{1,20}$")
_VALID_PERIODS = set(PERIOD_DAYS.keys())

# ── App ─────────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Vantage Market API",
    version="2.0.0",
    description=(
        "Institutional market data API: returns, history, correlation, "
        "movers, and technical metrics computed server-side from Yahoo Finance."
    ),
    docs_url="/docs"       if IS_DEV else None,
    redoc_url="/redoc"     if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else (["*"] if IS_DEV else []),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)


# ── Helpers ─────────────────────────────────────────────────────────────────
def _validate_ticker(ticker: str) -> str:
    t = ticker.upper().strip()
    if not _TICKER_RE.match(t):
        raise HTTPException(status_code=400, detail="Invalid ticker format.")
    if t not in ALLOWED_TICKERS:
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{t}' is not in the allowed list. "
                   f"See /api/tickers for the full list.",
        )
    return t


def _get_all_returns() -> dict:
    """Fetch & compute all returns, with 5-min in-memory cache."""
    cached = returns_cache.get("all")
    if cached is not None:
        return cached
    result = compute_all_returns(fetch_all_data())
    returns_cache.set("all", result)
    return result


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/", tags=["meta"])
def root():
    """Health ping."""
    return {"status": "ok", "version": "2.0.0"}


@app.get("/api/health", tags=["meta"])
def health():
    """Liveness check with server timestamp."""
    return {"status": "ok", "ts": int(time.time() * 1000)}


# ── Tickers ─────────────────────────────────────────────────────────────────

@app.get("/api/tickers", tags=["reference"])
def get_tickers():
    """
    Return the list of all supported tickers with their human-readable labels
    and available period options.
    """
    labels = get_ticker_labels()
    return {
        "tickers": [
            {"ticker": k, "label": v}
            for k, v in labels.items()
        ],
        "periods": list(PERIOD_DAYS.keys()),
        "count": len(labels),
    }


# ── Returns ──────────────────────────────────────────────────────────────────

@app.get("/api/returns", tags=["returns"])
@limiter.limit("30/minute")
def get_returns(request: Request):
    """
    Compute and return period returns + technical metrics for all tickers.
    Results are cached server-side for 5 minutes.
    """
    try:
        return {"data": _get_all_returns(), "cached_ttl_s": 300}
    except Exception as e:
        logger.error("get_returns failed: %s", e)
        raise HTTPException(status_code=500, detail="Data fetch failed.")


@app.get("/api/returns/{ticker}", tags=["returns"])
@limiter.limit("60/minute")
def get_single_return(ticker: str, request: Request):
    """
    Return all computed metrics for a single ticker.
    Draws from the shared 5-min cache when available.
    """
    safe = _validate_ticker(ticker)
    try:
        all_returns = _get_all_returns()
        if safe not in all_returns:
            raise HTTPException(status_code=404, detail="No data for this ticker.")
        return {"data": all_returns[safe]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_single_return(%s): %s", safe, e)
        raise HTTPException(status_code=500, detail="Data fetch failed.")


# ── History ──────────────────────────────────────────────────────────────────

@app.get("/api/history/{ticker}", tags=["history"])
@limiter.limit("30/minute")
def get_history(
    ticker: str,
    request: Request,
    period: str = Query(default="1y", description="One of: 1m, 3m, 6m, 1y, 3y, 5y, max"),
):
    """
    Return daily OHLCV history for a single ticker over the requested period.

    Response format:
    ```json
    {
      "ticker": "^GSPC",
      "period": "1y",
      "dates": ["2024-06-21", ...],
      "open":  [...],
      "high":  [...],
      "low":   [...],
      "close": [...],
      "volume": [...]
    }
    ```
    Results cached 10 minutes server-side.
    """
    safe = _validate_ticker(ticker)
    if period not in _VALID_PERIODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid period '{period}'. Valid: {sorted(_VALID_PERIODS)}",
        )

    cache_key = f"hist:{safe}:{period}"
    cached = history_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        df = fetch_history(safe, period=period)
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="No data returned for this ticker/period.")

        # ── Smart resampling for longer periods ─────────────────────────────
        # Daily data for >1Y periods causes browser chart lag (1200+ SVG nodes).
        # Resample to weekly OHLCV — preserves shape while cutting points 5x.
        resolution = "daily"
        if period in ("3y", "5y", "max"):
            df = df.resample("W-FRI").agg({
                **({"Open":   "first"} if "Open"   in df.columns else {}),
                **({"High":   "max"}   if "High"   in df.columns else {}),
                **({"Low":    "min"}   if "Low"    in df.columns else {}),
                **({"Close":  "last"}  if "Close"  in df.columns else {}),
                **({"Volume": "sum"}   if "Volume" in df.columns else {}),
            }).dropna(subset=["Close"] if "Close" in df.columns else [])
            resolution = "weekly"

        def _series(col: str) -> list:
            if col not in df.columns:
                return []
            return [None if (v is None or (isinstance(v, float) and np.isnan(v))) else round(float(v), 4)
                    for v in df[col]]

        response = {
            "ticker": safe,
            "label": DEFAULT_TICKERS.get(safe, safe),
            "period": period,
            "resolution": resolution,
            "dates":  [d.strftime("%Y-%m-%d") for d in df.index],
            "open":   _series("Open"),
            "high":   _series("High"),
            "low":    _series("Low"),
            "close":  _series("Close"),
            "volume": _series("Volume"),
            "count":  len(df),
        }
        history_cache.set(cache_key, response)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_history(%s, %s): %s", safe, period, e)
        raise HTTPException(status_code=500, detail="Data fetch failed.")



# ── Compare (normalised) ──────────────────────────────────────────────────────

@app.get("/api/compare", tags=["analytics"])
@limiter.limit("20/minute")
def compare_tickers(
    request: Request,
    tickers: str = Query(
        ...,
        description="Comma-separated list of tickers to compare, e.g. '^GSPC,GLD,AGG'",
    ),
    period: str = Query(default="1y", description="One of: 1m, 3m, 6m, 1y, 3y, 5y, max"),
):
    """
    Return normalised (rebased to 100 at period start) daily close prices for
    multiple tickers on aligned dates.  Useful for charting relative performance.

    ```
    GET /api/compare?tickers=^GSPC,GLD,AGG&period=1y
    ```
    """
    if period not in _VALID_PERIODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid period '{period}'. Valid: {sorted(_VALID_PERIODS)}",
        )

    raw_tickers = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not raw_tickers:
        raise HTTPException(status_code=400, detail="No tickers provided.")
    if len(raw_tickers) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 tickers per compare request.")

    for t in raw_tickers:
        _validate_ticker(t)  # raises 400/404 if invalid

    cache_key = f"compare:{':'.join(sorted(raw_tickers))}:{period}"
    cached = history_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        # Fetch close series for all tickers
        series_map: dict[str, pd.Series] = {}
        for t in raw_tickers:
            df = fetch_history(t, period=period)
            if df is not None and not df.empty and "Close" in df.columns:
                series_map[t] = df["Close"].squeeze()

        if not series_map:
            raise HTTPException(status_code=404, detail="No data returned for any of the requested tickers.")

        # Align on common index
        combined = pd.concat(series_map.values(), axis=1, keys=series_map.keys()).dropna(how="all")
        # Rebase to 100 at first common date
        base = combined.iloc[0]
        normalised = (combined / base * 100).round(4)

        dates = [d.strftime("%Y-%m-%d") for d in normalised.index]
        series_out = {}
        for t in normalised.columns:
            vals = normalised[t].tolist()
            series_out[t] = {
                "label": DEFAULT_TICKERS.get(t, t),
                "values": [None if (v is None or (isinstance(v, float) and np.isnan(v))) else v for v in vals],
            }

        response = {
            "period":      period,
            "base":        100,
            "dates":       dates,
            "series":      series_out,
            "tickers":     list(series_out.keys()),
        }
        history_cache.set(cache_key, response)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("compare_tickers(%s, %s): %s", raw_tickers, period, e)
        raise HTTPException(status_code=500, detail="Data fetch failed.")


# ── Correlation matrix ──────────────────────────────────────────────────────

@app.get("/api/correlation", tags=["analytics"])
@limiter.limit("20/minute")
def get_correlation(
    request: Request,
    period: str = Query(default="1y", description="One of: 1m, 3m, 6m, 1y, 3y, 5y, max"),
):
    """
    Return the pairwise Pearson correlation matrix of daily returns for all
    supported tickers over the specified period.

    ```json
    {
      "period": "1y",
      "tickers": ["^GSPC", "EFA", ...],
      "matrix":  [[1.0, 0.85, ...], ...]
    }
    ```
    """
    if period not in _VALID_PERIODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid period '{period}'. Valid: {sorted(_VALID_PERIODS)}",
        )

    cache_key = f"corr:{period}"
    cached = history_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        returns_map = fetch_correlation_data(period=period)
        if len(returns_map) < 2:
            raise HTTPException(status_code=500, detail="Insufficient data to compute correlation.")

        labels = get_ticker_labels()
        combined = pd.concat(returns_map.values(), axis=1, keys=returns_map.keys()).dropna()
        corr = combined.corr(method="pearson").round(4)

        tickers_ordered = list(corr.columns)
        matrix = corr.values.tolist()

        response = {
            "period":  period,
            "tickers": tickers_ordered,
            "labels":  {t: labels.get(t, t) for t in tickers_ordered},
            "matrix":  matrix,
        }
        history_cache.set(cache_key, response)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_correlation(%s): %s", period, e)
        raise HTTPException(status_code=500, detail="Data fetch failed.")


# ── Movers ───────────────────────────────────────────────────────────────────

@app.get("/api/movers", tags=["analytics"])
@limiter.limit("30/minute")
def get_movers(
    request: Request,
    n: int = Query(default=3, ge=1, le=7, description="Number of top/bottom movers to return"),
    period: Literal["1d", "mtd", "qtd", "ytd", "1y"] = Query(
        default="1d",
        description="Ranking period: 1d (one-day), mtd, qtd, ytd, or 1y",
    ),
):
    """
    Return the top N gainers and bottom N losers ranked by the chosen period
    return.  Draws from the shared returns cache (5 min TTL).

    ```json
    {
      "period": "1d",
      "gainers": [{"ticker": "GLD", "label": "Gold", "return": 1.25}, ...],
      "losers":  [...]
    }
    ```
    """
    period_key_map = {
        "1d":  "one_day_return",
        "mtd": "mtd",
        "qtd": "qtd",
        "ytd": "ytd",
        "1y":  "1y",
    }
    key = period_key_map[period]

    try:
        all_returns = _get_all_returns()
        entries = [
            {
                "ticker": v["ticker"],
                "label":  v["label"],
                "return": v.get(key),
            }
            for v in all_returns.values()
            if v.get(key) is not None
        ]
        entries.sort(key=lambda x: x["return"], reverse=True)
        return {
            "period":  period,
            "gainers": entries[:n],
            "losers":  entries[-n:][::-1],
            "all":     entries,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_movers(%s): %s", period, e)
        raise HTTPException(status_code=500, detail="Data fetch failed.")


# ── Cache management ─────────────────────────────────────────────────────────

@app.get("/api/cache/status", tags=["meta"])
def cache_status():
    """Return the keys currently alive in each in-memory cache."""
    return {
        "returns_cache_keys": returns_cache.keys(),
        "history_cache_keys": history_cache.keys(),
    }


@app.get("/api/cache/clear", tags=["meta"])
def cache_clear():
    """
    Purge both in-memory caches.  Next request will re-fetch from Yahoo Finance.
    Only available in development mode.
    """
    if not IS_DEV:
        raise HTTPException(status_code=403, detail="Cache clearing is only available in development mode.")
    returns_cache.clear()
    history_cache.clear()
    return {"status": "cleared"}
