"use client";

const ROWS = [
  { label: "S&P 500 (SPY)", value: "+1.24%", bar: 0.82, range: "+2.1%", pos: true },
  { label: "NASDAQ (QQQ)", value: "+1.87%", bar: 0.9, range: "+3.2%", pos: true },
  { label: "MSCI EM (EEM)", value: "−0.43%", bar: 0.4, range: "−0.7%", pos: false },
  { label: "Euro Stoxx (VGK)", value: "+0.61%", bar: 0.62, range: "+1.1%", pos: true },
];

export default function LivePanel() {
  return (
    <div
      style={{
        width: 460,
        background: "var(--bg-surface)",
        border: "1px solid var(--bg-raised)",
        borderRadius: 10,
        padding: "18px 20px",
        color: "var(--tx-primary)",
        fontFamily: "var(--font-inter)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="hero-label" style={{ color: "var(--tx-secondary)" }}>
          Live Returns
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--ac-primary)",
            letterSpacing: "0.08em",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--ac-primary)",
              boxShadow: "0 0 8px var(--ac-primary)",
            }}
          />
          LIVE
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--tx-tertiary)", marginTop: 2 }}>Updated 14s ago</div>

      <div style={{ height: 1, background: "var(--bg-raised)", margin: "14px 0" }} />

      {ROWS.map((r) => (
        <div
          key={r.label}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 90px auto",
            gap: 12,
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--tx-secondary)" }}>{r.label}</span>
          <span
            className="hero-data-mono"
            style={{ fontSize: 16, color: r.pos ? "var(--data-pos)" : "var(--data-neg)" }}
          >
            {r.value}
          </span>
          <span
            style={{
              height: 6,
              borderRadius: 3,
              background: "var(--bg-raised)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                width: `${r.bar * 100}%`,
                background: r.pos ? "var(--data-pos)" : "var(--data-neg)",
                borderRadius: 3,
              }}
            />
          </span>
          <span
            className="hero-data-mono"
            style={{ fontSize: 13, color: "var(--tx-tertiary)", textAlign: "right" }}
          >
            {r.range}
          </span>
        </div>
      ))}

      <div style={{ height: 1, background: "var(--bg-raised)", margin: "14px 0 10px" }} />
      <div style={{ fontSize: 11, color: "var(--tx-tertiary)", letterSpacing: "0.04em" }}>
        7 indices · yfinance · FastAPI · Railway
      </div>
    </div>
  );
}
