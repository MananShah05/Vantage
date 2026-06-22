"""
Unit tests for compute_returns and the TTL cache.

Run with:
    python -m pytest test_compute.py -v
or:
    python test_compute.py
"""
import unittest
import time
import pandas as pd
import numpy as np
from datetime import datetime, date, timedelta

from compute_returns import compute_returns_for_series, _rsi, _beta, _annualise
from cache import TTLCache


# ────────────────────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────────────────────

def _make_series(n_days: int = 365 * 6, slope: float = 0.05, base: float = 100.0) -> pd.Series:
    """Linear trending series with *n_days* of daily observations."""
    today = datetime.today().date()
    dates = [pd.Timestamp(today - timedelta(days=i)) for i in range(n_days)]
    dates.reverse()
    prices = [base + i * slope for i in range(len(dates))]
    return pd.Series(prices, index=dates)


def _make_volatile_series(n_days: int = 400, seed: int = 42) -> pd.Series:
    """GBM-like noisy series."""
    rng = np.random.default_rng(seed)
    today = datetime.today().date()
    dates = [pd.Timestamp(today - timedelta(days=i)) for i in range(n_days)]
    dates.reverse()
    log_returns = rng.normal(0.0003, 0.012, n_days)
    prices = 100.0 * np.exp(np.cumsum(log_returns))
    return pd.Series(prices, index=dates)


# ────────────────────────────────────────────────────────────────────────────
# Tests: compute_returns_for_series
# ────────────────────────────────────────────────────────────────────────────

class TestComputeReturns(unittest.TestCase):

    def setUp(self):
        self.series_long = _make_series(n_days=365 * 6)
        self.series_short = _make_series(n_days=10)
        self.volatile = _make_volatile_series()

    # ── Core keys ──────────────────────────────────────────────────────────

    def test_all_expected_keys_present(self):
        res = compute_returns_for_series(self.series_long)
        expected = [
            "latest_price", "latest_date",
            "mtd", "qtd", "ytd", "1y", "3y_ann", "5y_ann",
            "one_day_return", "volatility_1y", "sharpe_1y",
            "max_drawdown_1y", "calmar_1y",
            "dist_sma_50", "dist_sma_200",
            "high_52w", "low_52w", "dist_high_52w", "dist_low_52w",
            "rsi_14", "beta", "cagr_full",
        ]
        for k in expected:
            with self.subTest(key=k):
                self.assertIn(k, res)

    def test_latest_price_is_last_element(self):
        s = self.series_long
        res = compute_returns_for_series(s)
        self.assertAlmostEqual(res["latest_price"], float(s.iloc[-1]), places=5)

    def test_latest_date_format(self):
        res = compute_returns_for_series(self.series_long)
        # Should be valid ISO date string
        datetime.strptime(res["latest_date"], "%Y-%m-%d")

    # ── Insufficient history ────────────────────────────────────────────────

    def test_short_series_missing_metrics_are_none(self):
        res = compute_returns_for_series(self.series_short)
        self.assertIsNone(res["3y_ann"],        "3y_ann should be None")
        self.assertIsNone(res["5y_ann"],        "5y_ann should be None")
        self.assertIsNone(res["volatility_1y"], "vol_1y needs >= 30 obs")
        self.assertIsNone(res["dist_sma_50"],   "sma50 needs >= 50 obs")
        self.assertIsNone(res["dist_sma_200"],  "sma200 needs >= 200 obs")
        self.assertIsNone(res["rsi_14"],        "rsi needs >= 15 obs")

    # ── Returns sanity ──────────────────────────────────────────────────────

    def test_positive_ytd_on_uptrend(self):
        res = compute_returns_for_series(self.series_long)
        self.assertGreater(res["ytd"], 0)

    def test_one_day_return_correct(self):
        s = self.series_long
        expected = round(((float(s.iloc[-1]) / float(s.iloc[-2])) - 1.0) * 100, 2)
        res = compute_returns_for_series(s)
        self.assertAlmostEqual(res["one_day_return"], expected, places=2)

    # ── New metrics ─────────────────────────────────────────────────────────

    def test_rsi_in_valid_range(self):
        res = compute_returns_for_series(self.volatile)
        self.assertIsNotNone(res["rsi_14"])
        self.assertGreaterEqual(res["rsi_14"], 0)
        self.assertLessEqual(res["rsi_14"], 100)

    def test_max_drawdown_is_non_positive(self):
        res = compute_returns_for_series(self.volatile)
        self.assertIsNotNone(res["max_drawdown_1y"])
        self.assertLessEqual(res["max_drawdown_1y"], 0)

    def test_calmar_sign_matches_return(self):
        """Calmar = ret / |drawdown|. Sign follows ret."""
        res = compute_returns_for_series(self.volatile)
        if res["calmar_1y"] is not None and res["1y"] is not None:
            self.assertEqual(
                np.sign(res["calmar_1y"]),
                np.sign(res["1y"]),
            )

    def test_cagr_full_on_long_series(self):
        res = compute_returns_for_series(self.series_long)
        self.assertIsNotNone(res["cagr_full"])
        # Uptrending → CAGR > 0
        self.assertGreater(res["cagr_full"], 0)

    def test_beta_with_market(self):
        market = _make_volatile_series(seed=0)
        asset  = _make_volatile_series(seed=7)
        res = compute_returns_for_series(asset, market_series=market)
        # Beta should be a finite float
        if res["beta"] is not None:
            self.assertTrue(np.isfinite(res["beta"]))

    def test_beta_none_without_market(self):
        res = compute_returns_for_series(self.volatile)
        self.assertIsNone(res["beta"])

    def test_52w_high_ge_52w_low(self):
        res = compute_returns_for_series(self.volatile)
        if res["high_52w"] and res["low_52w"]:
            self.assertGreaterEqual(res["high_52w"], res["low_52w"])

    def test_dist_high_52w_lte_zero(self):
        """Current price can be at most equal to the 52w high (dist <= 0)."""
        res = compute_returns_for_series(self.volatile)
        if res["dist_high_52w"] is not None:
            self.assertLessEqual(res["dist_high_52w"], 0.01)   # allow floating-point

    def test_empty_series_returns_empty_dict(self):
        res = compute_returns_for_series(pd.Series(dtype=float))
        self.assertEqual(res, {})

    # ── Helpers ─────────────────────────────────────────────────────────────

    def test_rsi_helper_bounds(self):
        s = _make_volatile_series(n_days=100)
        val = _rsi(s)
        self.assertIsNotNone(val)
        self.assertGreaterEqual(val, 0)
        self.assertLessEqual(val, 100)

    def test_rsi_helper_insufficient_data(self):
        s = pd.Series([100.0, 101.0, 99.0])
        self.assertIsNone(_rsi(s, window=14))

    def test_beta_helper(self):
        n = 200
        market = pd.Series(np.random.default_rng(1).normal(0.001, 0.01, n))
        # Asset is exactly 2× market → beta ≈ 2
        asset = market * 2
        b = _beta(asset, market)
        self.assertAlmostEqual(b, 2.0, places=1)

    def test_annualise_basic(self):
        # 21 % over 3 years → ~6.56 % CAGR
        result = _annualise(21.0, 3)
        self.assertIsNotNone(result)
        self.assertAlmostEqual(result, 6.56, delta=0.05)


# ────────────────────────────────────────────────────────────────────────────
# Tests: TTLCache
# ────────────────────────────────────────────────────────────────────────────

class TestTTLCache(unittest.TestCase):

    def test_set_and_get(self):
        c = TTLCache(ttl_seconds=10)
        c.set("x", 42)
        self.assertEqual(c.get("x"), 42)

    def test_missing_key_returns_none(self):
        c = TTLCache(ttl_seconds=10)
        self.assertIsNone(c.get("nonexistent"))

    def test_expiry(self):
        c = TTLCache(ttl_seconds=1)
        c.set("y", "hello")
        time.sleep(1.1)
        self.assertIsNone(c.get("y"))

    def test_invalidate(self):
        c = TTLCache(ttl_seconds=60)
        c.set("z", [1, 2, 3])
        c.invalidate("z")
        self.assertIsNone(c.get("z"))

    def test_clear(self):
        c = TTLCache(ttl_seconds=60)
        c.set("a", 1)
        c.set("b", 2)
        c.clear()
        self.assertEqual(c.keys(), [])

    def test_keys_excludes_expired(self):
        c = TTLCache(ttl_seconds=1)
        c.set("live", "yes")
        c.set("dead", "soon")
        time.sleep(1.1)
        # Re-set one so it is alive
        c.set("live", "yes")
        keys = c.keys()
        self.assertIn("live", keys)
        self.assertNotIn("dead", keys)

    def test_overwrite(self):
        c = TTLCache(ttl_seconds=60)
        c.set("k", 1)
        c.set("k", 99)
        self.assertEqual(c.get("k"), 99)


if __name__ == "__main__":
    unittest.main()
