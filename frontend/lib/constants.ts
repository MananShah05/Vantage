export const TICKER_ORDER = [
  "^GSPC",
  "EFA",
  "EEM",
  "AGG",
  "VNQ",
  "GLD",
  "DX-Y.NYB"
];

export const PERIOD_COLUMNS = [
  { key: "label",   label: "Index"   },
  { key: "mtd",     label: "MTD"     },
  { key: "qtd",     label: "QTD"     },
  { key: "ytd",     label: "YTD"     },
  { key: "1y",      label: "1Y"      },
  { key: "3y_ann",  label: "3Y ann." },
  { key: "5y_ann",  label: "5Y ann." },
] as const;

export type SortKey = "label" | "mtd" | "qtd" | "ytd" | "1y" | "3y_ann" | "5y_ann";
