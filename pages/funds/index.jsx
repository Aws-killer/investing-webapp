import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useGetFundsQuery,
  useGetFundsPerformanceQuery,
  useCompareFundsQuery,
} from "@/features/api/fundsApi";
import {
  RefreshCw, GitCompare, X, Star, AlertTriangle, Info,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ─── UTILS ─────────────────────────────────────────────────────────────── */
const cn = (...c) => c.filter(Boolean).join(" ");

const fmt = (v, decimals = 2) => {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(v));
};

const fmtCompact = (v, ccy = "") => {
  if (v == null) return "—";
  const s = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(v));
  return ccy ? `${ccy} ${s}` : s;
};

const fmtMoney = (v, ccy = "TZS", compact = false) => {
  if (v == null) return "—";
  if (compact) return fmtCompact(v, ccy);
  return `${ccy} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(v))}`;
};

const fmtPct = (v, sign = true) => {
  if (v == null) return "—";
  const n = Number(v);
  return `${sign && n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
};

const fmtAxisDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  } catch { return d; }
};

const parseAmount = (s) => {
  const n = Number(String(s).replace(/,/g, ""));
  return n > 0 ? n : null;
};

/* ─── CONSTANTS ─────────────────────────────────────────────────────────── */
const DATE_PRESETS = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "3Y", days: 365 * 3 },
  { label: "Max", days: null },
];

const DIST_FREQ = [
  { label: "None",      value: 0  },
  { label: "Annual",    value: 1  },
  { label: "Semi-ann.", value: 2  },
  { label: "Quarterly", value: 4  },
  { label: "Monthly",   value: 12 },
];

// Per-fund distribution constraints + plan conditions from offer documents
const FUND_DIST_CONFIG = {
  "Bond Fund": {
    freqOptions: [0, 2, 12],
    freqLabels:  { 0: "Reinvest", 2: "Semi-ann.", 12: "Monthly" },
    planConditions: {
      0:  { label: "Reinvestment Plan",              minInitial: 50_000,     minAdditional: 5_000, exitFee: null },
      2:  { label: "Semi-annual Distribution Plan",  minInitial: 5_000_000,  minAdditional: 5_000, exitFee: null },
      12: { label: "Monthly Distribution Plan",      minInitial: 10_000_000, minAdditional: 5_000, exitFee: null },
    },
    hint: "Typically TZS 1.00/unit/month for the monthly plan. Check your fund statement for the declared rate.",
    defaultPerUnit: "1",
  },
  "Jikimu Fund": {
    freqOptions: [0, 1, 4],
    freqLabels:  { 0: "Capital Growth", 1: "Annual Dividend", 4: "Quarterly Dividend" },
    planConditions: {
      0: { label: "Capital Growth Plan",    minInitial: 5_000,     minAdditional: 5_000,  exitFee: null },
      1: { label: "Annual Dividend Plan",   minInitial: 1_000_000, minAdditional: 15_000, exitFee: null },
      4: { label: "Quarterly Dividend Plan",minInitial: 2_000_000, minAdditional: 15_000, exitFee: null },
    },
    hint: "Max 16% p.a. (4%/quarter). Enter the declared per-unit amount from your fund statement.",
    defaultPerUnit: "",
  },
  "iIncome": {
    freqOptions: [0, 2],
    freqLabels:  { 0: "Reinvest", 2: "Semi-ann." },
    planConditions: {
      0: { label: "Reinvestment",           minInitial: 10_000_000, minAdditional: 100_000, exitFee: "1% of NAV" },
      2: { label: "Semi-annual Income",     minInitial: 10_000_000, minAdditional: 100_000, exitFee: "1% of NAV" },
    },
    hint: "Semi-annual at manager's discretion. Enter the declared per-unit amount from your fund statement.",
    defaultPerUnit: "",
  },
  "Imaan": {
    freqOptions: [0, 2],
    freqLabels:  { 0: "Reinvest", 2: "Semi-ann." },
    planConditions: {
      0: { label: "Reinvestment",       minInitial: 100_000, minAdditional: 10_000, exitFee: "1% of NAV" },
      2: { label: "Semi-annual Income", minInitial: 100_000, minAdditional: 10_000, exitFee: "1% of NAV" },
    },
    hint: "Semi-annual distribution. Enter the declared per-unit amount from your fund statement.",
    defaultPerUnit: "",
  },
};

const PERF_TABS = [
  { id: "weekly_return", label: "1W", navKey: "week_nav" },
  { id: "monthly_return", label: "1M", navKey: "month_nav" },
  { id: "ytd_return", label: "YTD", navKey: "ytd_nav" },
];

const FUND_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#3b82f6", "#ec4899", "#14b8a6", "#f97316",
];

const TYPE_COLOR = {
  "Money Market": "text-blue-400 bg-blue-400/10",
  Equity:         "text-emerald-400 bg-emerald-400/10",
  Bond:           "text-amber-400 bg-amber-400/10",
  Balanced:       "text-purple-400 bg-purple-400/10",
  Islamic:        "text-teal-400 bg-teal-400/10",
};

/* ─── MERGE CHART SERIES ─────────────────────────────────────────────────── */
function mergeSeriesData(funds) {
  const dateMap = {};
  funds.forEach((f) => {
    f.data?.forEach(({ date, indexed }) => {
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][f.id] = indexed;
    });
  });
  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
}

/* ─── CHART TOOLTIP ─────────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label, funds }) => {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl text-[11px] min-w-[180px]">
      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">{fmtAxisDate(label)}</p>
      {sorted.map((p) => {
        const f = funds?.find((x) => String(x.id) === String(p.dataKey));
        const ret = (p.value ?? 100) - 100;
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
              <span className="text-white/70 truncate max-w-[110px]">{f?.name ?? p.name}</span>
            </div>
            <span className={cn("font-semibold tabular-nums", ret >= 0 ? "text-emerald-400" : "text-red-400")}>
              {ret >= 0 ? "+" : ""}{ret.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── SHARED UI ─────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.18em] mb-3">{children}</p>
);

const Pill = ({ active, onClick, children, color }) => (
  <button
    onClick={onClick}
    className={cn(
      "h-8 px-3.5 rounded-full text-[12px] font-semibold transition-all border",
      active
        ? "text-black border-transparent"
        : "border-white/10 text-white/50 hover:text-white hover:border-white/20",
    )}
    style={active && color ? { backgroundColor: color } : active ? { backgroundColor: "white" } : {}}
  >
    {children}
  </button>
);

const Warning = ({ children }) => (
  <div className="flex gap-2.5 p-3 bg-amber-400/5 border border-amber-400/15 rounded-xl">
    <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
    <p className="text-[11px] text-amber-400/80 leading-relaxed">{children}</p>
  </div>
);

const Notice = ({ children }) => (
  <div className="flex gap-2.5 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
    <Info size={13} className="text-white/30 shrink-0 mt-0.5" />
    <p className="text-[11px] text-white/40 leading-relaxed">{children}</p>
  </div>
);

/* ─── ALL FUNDS TAB ─────────────────────────────────────────────────────── */
function AllFundsTab() {
  const { data: funds = [], isLoading } = useGetFundsQuery();

  const grouped = useMemo(() => {
    const m = {};
    funds.forEach((f) => {
      const key = f.manager_name || "Other";
      if (!m[key]) m[key] = [];
      m[key].push(f);
    });
    return m;
  }, [funds]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([manager, items]) => (
        <div key={manager}>
          <SectionLabel>{manager}</SectionLabel>
          <div className="space-y-1.5">
            {items.map((fund) => (
              <Link
                key={fund.id}
                href={`/funds/${fund.id}`}
                className="flex items-center justify-between px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition"
              >
                <div>
                  <p className="text-[14px] font-semibold text-white">{fund.name}</p>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block", TYPE_COLOR[fund.fund_type] || "text-white/40 bg-white/5")}>
                    {fund.fund_type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-white">
                    {fmt(fund.nav_per_unit, 4)}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5">{fund.currency} / unit</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── PERFORMANCE TAB ───────────────────────────────────────────────────── */
function PerformanceTab({ periodKey, navKey }) {
  const { data: perfFunds = [], isLoading } = useGetFundsPerformanceQuery();

  const sorted = useMemo(
    () => [...perfFunds].sort((a, b) => (b[periodKey] ?? -Infinity) - (a[periodKey] ?? -Infinity)),
    [perfFunds, periodKey],
  );

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {sorted.map((fund, rank) => {
        const ret = fund[periodKey];
        const pos = ret != null && Number(ret) >= 0;
        const maxAbs = Math.max(...sorted.map((f) => Math.abs(f[periodKey] ?? 0)), 0.01);
        const barW = ret != null ? (Math.abs(ret) / maxAbs) * 100 : 0;
        return (
          <Link
            key={fund.id}
            href={`/funds/${fund.id}`}
            className="flex items-center justify-between px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition relative overflow-hidden"
          >
            <div
              className="absolute left-0 top-0 bottom-0 rounded-2xl opacity-[0.06]"
              style={{
                width: `${barW}%`,
                backgroundColor: pos ? "#10b981" : "#ef4444",
              }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <span className="text-[11px] font-bold text-white/20 w-5">#{rank + 1}</span>
              <div>
                <p className="text-[13px] font-semibold text-white">{fund.name}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{fund.manager_name}</p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className={cn("text-[15px] font-bold", ret == null ? "text-white/20" : pos ? "text-emerald-400" : "text-red-400")}>
                {ret != null ? fmtPct(ret) : "—"}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5 tabular-nums">
                {fund[navKey] != null ? `${fmt(fund[navKey], 2)} → ${fmt(fund.nav_per_unit, 2)}` : `NAV ${fmt(fund.nav_per_unit, 2)}`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── COMPARE TAB ───────────────────────────────────────────────────────── */
function CompareTab({ allFunds }) {
  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

  /* ── State ── */
  const [selectedIds, setSelectedIds] = useState([]);
  const [benchmarkId, setBenchmarkId] = useState(null);
  const [fromDate, setFromDate] = useState(oneYearAgo);
  const [toDate, setToDate] = useState(today);
  const [committed, setCommitted] = useState(null);
  const [activePreset, setActivePreset] = useState("1Y");

  // Investment amount
  const [investAmountStr, setInvestAmountStr] = useState("");
  const investAmount = useMemo(() => parseAmount(investAmountStr), [investAmountStr]);

  // Per-fund distribution settings: { [fundId]: { freq: number, perUnitStr: string } }
  const [distSettings, setDistSettings] = useState({});

  const getDistForFund = (id) => distSettings[id] ?? { freq: 0, perUnitStr: "" };
  const setDistForFund = (id, key, val) =>
    setDistSettings((prev) => ({ ...prev, [id]: { ...getDistForFund(id), [key]: val } }));

  /* ── Derived ── */
  const canCompare = selectedIds.length >= 2 && fromDate && toDate;

  const grouped = useMemo(() => {
    const m = {};
    allFunds.forEach((f) => {
      const key = f.manager_name || "Other";
      if (!m[key]) m[key] = [];
      m[key].push(f);
    });
    return m;
  }, [allFunds]);

  /* ── API ── */
  const { data: compareData, isLoading, isFetching } = useCompareFundsQuery(
    { fundIds: committed?.ids ?? [], fromDate: committed?.from, toDate: committed?.to },
    { skip: !committed },
  );

  const funds = compareData?.funds ?? [];
  const chartData = useMemo(() => (funds.length ? mergeSeriesData(funds) : []), [funds]);
  const benchmark = funds.find((f) => f.id === benchmarkId);

  /* ── Fee + distribution calculations ── */
  const fundCalc = useMemo(() => {
    const map = {};
    for (const f of funds) {
      const meta = allFunds.find((x) => x.id === f.id);
      if (!meta || !meta.nav_per_unit) {
        map[f.id] = {};
        continue;
      }

      const nav    = meta.nav_per_unit;
      const sale   = meta.sale_price ?? nav;
      const repurchase = meta.repurchase_price ?? nav;

      // Entry / exit ratios (1.0 = no fee, 0.99 = 1% exit fee, etc.)
      const entryRatio = sale / nav;
      const exitRatio  = repurchase / nav;
      const feeDrag    = exitRatio / entryRatio;

      const exitFeePct  = Math.max(0, (1 - exitRatio) * 100);
      const entryFeePct = Math.max(0, (entryRatio - 1) * 100);

      // Gross NAV return
      const grossMultiple = f.total_return != null ? 1 + f.total_return / 100 : null;

      // Period in years
      const years = (f.days ?? 0) / 365.25;

      // ── Money simulation ──
      let units = null, navGain = null, distTotal = null, exitFeeAmt = null,
          endValue = null, netProfit = null, netReturn = null, netAnn = null;

      if (investAmount && f.start_nav && f.end_nav) {
        // Units purchased: invest ÷ (start_nav × entryRatio)
        units = investAmount / (f.start_nav * entryRatio);

        // NAV gain before exit fee
        const grossEndValue = units * f.end_nav;

        // Exit fee amount deducted on redemption
        exitFeeAmt = grossEndValue * (1 - exitRatio);

        // Final value from units after exit
        const netEndValue = grossEndValue * exitRatio;

        // Distributions: per-fund settings
        const dist = getDistForFund(f.id);
        const distPerUnit = parseAmount(dist.perUnitStr);
        const numPayments = meta.pays_income && dist.freq > 0 && distPerUnit
          ? Math.floor(dist.freq * years)
          : 0;
        distTotal = units * (distPerUnit ?? 0) * numPayments;

        navGain   = netEndValue - investAmount;
        endValue  = netEndValue + distTotal;
        netProfit = endValue - investAmount;
        netReturn = (netProfit / investAmount) * 100;

        // Annualize
        if (years >= 0.08 && endValue > 0) {
          netAnn = (Math.pow(endValue / investAmount, 1 / years) - 1) * 100;
        } else {
          netAnn = netReturn;
        }
      } else if (grossMultiple != null) {
        // No money entered — just show fee-adjusted % return
        const netMultiple = grossMultiple * feeDrag;
        netReturn = (netMultiple - 1) * 100;
        netAnn = years >= 0.08
          ? (Math.pow(netMultiple, 1 / years) - 1) * 100
          : netReturn;
      }

      map[f.id] = {
        units, navGain, distTotal, exitFeeAmt, endValue,
        netProfit, netReturn, netAnn,
        exitFeePct, entryFeePct, feeDrag,
        currency: meta.currency ?? f.currency ?? "TZS",
        paysIncome: meta.pays_income,
      };
    }
    return map;
  }, [funds, allFunds, investAmount, distSettings]);

  /* ── Sorted results ── */
  const sortedFunds = useMemo(
    () => [...funds].sort(
      (a, b) =>
        (fundCalc[b.id]?.netReturn ?? b.total_return ?? -Infinity) -
        (fundCalc[a.id]?.netReturn ?? a.total_return ?? -Infinity),
    ),
    [funds, fundCalc],
  );
  const topId = sortedFunds[0]?.id;

  /* ── Handlers ── */
  const toggleFund = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 8 ? [...prev, id] : prev,
    );

  const applyPreset = (label, days) => {
    const from = days
      ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      : "2000-01-01";
    setFromDate(from);
    setToDate(today);
    setActivePreset(label);
    if (selectedIds.length >= 2) setCommitted({ ids: [...selectedIds], from, to: today });
  };

  const handleCompare = () => {
    if (!canCompare) return;
    setCommitted({ ids: [...selectedIds], from: fromDate, to: toDate });
  };

  return (
    <div className="space-y-4">

      {/* ── STEP 1: Pick funds ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <SectionLabel>Select funds</SectionLabel>
        <div className="space-y-4">
          {Object.entries(grouped).map(([manager, mFunds]) => (
            <div key={manager}>
              <p className="text-[10px] text-white/30 mb-2">{manager}</p>
              <div className="flex flex-wrap gap-2">
                {mFunds.map((f) => {
                  const idx = selectedIds.indexOf(f.id);
                  const sel = idx !== -1;
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFund(f.id)}
                      className={cn(
                        "h-8 px-3.5 rounded-full text-[12px] font-semibold transition-all border flex items-center gap-1.5",
                        sel
                          ? "text-black border-transparent"
                          : "border-white/10 text-white/50 hover:text-white hover:border-white/20",
                      )}
                      style={sel ? { backgroundColor: FUND_COLORS[idx] } : {}}
                    >
                      {f.name}
                      {f.pays_income && (
                        <span className={cn("text-[9px]", sel ? "text-black/60" : "text-white/30")}>
                          ↗
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
            {selectedIds.map((id, idx) => {
              const f = allFunds.find((x) => x.id === id);
              const isBench = benchmarkId === id;
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full border text-[11px] font-semibold"
                  style={{ borderColor: FUND_COLORS[idx] + "40", color: FUND_COLORS[idx] }}
                >
                  <button onClick={() => setBenchmarkId(isBench ? null : id)} title="Set benchmark">
                    <Star size={9} fill={isBench ? "currentColor" : "none"} />
                  </button>
                  <span>{f?.name}</span>
                  <button
                    onClick={() => {
                      setSelectedIds((p) => p.filter((x) => x !== id));
                      if (benchmarkId === id) setBenchmarkId(null);
                    }}
                    className="opacity-50 hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── STEP 2: Investment amount ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <SectionLabel>Your investment (optional)</SectionLabel>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={investAmountStr}
            onChange={(e) => setInvestAmountStr(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-4xl font-bold text-white placeholder-white/10 focus:outline-none pb-2 border-b border-white/10 focus:border-white/30 transition-colors"
          />
          <span className="absolute right-0 bottom-2.5 text-sm text-white/30 font-medium">TZS</span>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {[50000, 100000, 500000, 1000000, 5000000].map((a) => (
            <button
              key={a}
              onClick={() => setInvestAmountStr(a.toLocaleString())}
              className="h-7 px-3 rounded-full text-[11px] font-semibold bg-white/[0.05] hover:bg-white/10 text-white/50 hover:text-white transition border border-white/[0.06]"
            >
              {fmtCompact(a)}
            </button>
          ))}
        </div>
        {investAmount && investAmount < 50000 && (
          <Warning>Most funds require a minimum initial investment of TZS 50,000 or higher. Please check each fund's minimum before investing.</Warning>
        )}
      </div>


      {/* ── STEP 4: Period + Compare ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
        <div>
          <p className="text-[11px] text-white/40 mb-3">Comparison period</p>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((p) => (
              <Pill
                key={p.label}
                active={activePreset === p.label}
                onClick={() => applyPreset(p.label, p.days)}
              >
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex gap-3 flex-1 w-full">
            <div className="flex-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">From</p>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => { setFromDate(e.target.value); setActivePreset(null); }}
                className="w-full h-10 px-3 text-[13px] bg-white/[0.05] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5">To</p>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => { setToDate(e.target.value); setActivePreset(null); }}
                className="w-full h-10 px-3 text-[13px] bg-white/[0.05] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition"
              />
            </div>
          </div>
          <button
            onClick={handleCompare}
            disabled={!canCompare || isFetching}
            className="h-10 px-6 bg-white text-black text-[13px] font-bold rounded-xl hover:bg-white/90 transition disabled:opacity-20 whitespace-nowrap"
          >
            {isFetching ? "Loading…" : "Compare →"}
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!committed && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <GitCompare size={40} className="text-white/10" />
          <p className="text-[13px] text-white/30">
            Select 2+ funds and hit <span className="text-white/60 font-semibold">Compare →</span>
          </p>
        </div>
      )}

      {isLoading && (
        <div className="h-48 flex items-center justify-center text-white/30 text-sm">
          Loading…
        </div>
      )}

      {/* ── Results ── */}
      {!isLoading && funds.length > 0 && (
        <>
          {/* Chart */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
            <p className="text-[13px] font-semibold text-white mb-1">
              NAV performance
            </p>
            <p className="text-[10px] text-white/30 mb-5">
              Indexed to 100 at start · {committed?.from} → {committed?.to} · gross (pre-fee)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtAxisDate}
                  tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v - 100 >= 0 ? "+" : ""}${(v - 100).toFixed(0)}%`}
                  width={38}
                />
                <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                <Tooltip content={<ChartTooltip funds={funds} />} />
                {funds.map((f) => (
                  <Line
                    key={f.id}
                    type="monotone"
                    dataKey={String(f.id)}
                    stroke={FUND_COLORS[selectedIds.indexOf(f.id)]}
                    strokeWidth={f.id === benchmarkId ? 1.5 : 2}
                    strokeDasharray={f.id === benchmarkId ? "5 3" : undefined}
                    dot={false}
                    name={String(f.id)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Fund result cards */}
          <div className="space-y-3">
            <SectionLabel>
              {investAmount ? "Investment simulation" : "Return comparison"} — net of fees
            </SectionLabel>

            {sortedFunds.map((f, rank) => {
              const calc = fundCalc[f.id] ?? {};
              const isTop = f.id === topId;
              const isBench = f.id === benchmarkId;
              const color = FUND_COLORS[selectedIds.indexOf(f.id)];
              const netRet = calc.netReturn ?? (f.total_return ? f.total_return * (calc.feeDrag ?? 1) : null);
              const pos = netRet != null && netRet >= 0;

              // Bar width relative to best fund
              const maxNet = Math.max(...sortedFunds.map(x => Math.abs(fundCalc[x.id]?.netReturn ?? x.total_return ?? 0)), 0.01);
              const barW = netRet != null ? (Math.abs(netRet) / maxNet) * 100 : 0;

              return (
                <div
                  key={f.id}
                  className={cn(
                    "rounded-2xl border overflow-hidden transition",
                    isTop ? "border-white/20 bg-white/[0.05]" : "border-white/[0.06] bg-white/[0.02]",
                  )}
                >
                  {/* Color bar on left */}
                  <div className="flex">
                    <div className="w-1 shrink-0 rounded-l-2xl" style={{ backgroundColor: color }} />
                    <div className="flex-1 p-4">

                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-bold text-white">{f.name}</span>
                            {isTop && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 rounded-full px-2 py-0.5">
                                best
                              </span>
                            )}
                            {isBench && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 border border-white/10 rounded-full px-2 py-0.5">
                                benchmark
                              </span>
                            )}
                            {calc.exitFeePct > 0 && (
                              <span className="text-[9px] font-medium text-amber-400 border border-amber-400/20 bg-amber-400/5 rounded-full px-2 py-0.5">
                                {calc.exitFeePct.toFixed(1)}% exit fee
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/30 mt-0.5">{f.manager_name}</p>
                        </div>

                        {/* Big return number */}
                        <div className="text-right shrink-0">
                          {investAmount && calc.endValue != null ? (
                            <>
                              <p className="text-[18px] font-bold text-white">
                                {fmtMoney(calc.endValue, calc.currency)}
                              </p>
                              <p className={cn("text-[12px] font-semibold", pos ? "text-emerald-400" : "text-red-400")}>
                                {calc.netProfit >= 0 ? "+" : ""}{fmtMoney(calc.netProfit, calc.currency, true)}
                                <span className="text-[10px] font-normal ml-1">({fmtPct(netRet)})</span>
                              </p>
                            </>
                          ) : (
                            <p className={cn("text-[22px] font-bold", pos ? "text-emerald-400" : "text-red-400")}>
                              {netRet != null ? fmtPct(netRet) : "—"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Return bar */}
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barW}%`, backgroundColor: pos ? "#34d399" : "#f87171" }}
                        />
                      </div>

                      {/* Breakdown row */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px]">
                        <div>
                          <span className="text-white/30">Gross NAV </span>
                          <span className="text-white/60 font-medium">{fmtPct(f.total_return, true)}</span>
                        </div>
                        {calc.exitFeePct > 0 && (
                          <div>
                            <span className="text-white/30">Exit fee drag </span>
                            <span className="text-amber-400 font-medium">−{((1 - (calc.feeDrag ?? 1)) * 100).toFixed(2)}pp</span>
                          </div>
                        )}
                        {calc.distTotal != null && calc.distTotal > 0 && (
                          <div>
                            <span className="text-white/30">Distributions </span>
                            <span className="text-emerald-400 font-medium">+{fmtMoney(calc.distTotal, calc.currency, true)}</span>
                          </div>
                        )}
                        {calc.exitFeeAmt != null && calc.exitFeeAmt > 0.01 && (
                          <div>
                            <span className="text-white/30">Exit fee paid </span>
                            <span className="text-amber-400 font-medium">−{fmtMoney(calc.exitFeeAmt, calc.currency, true)}</span>
                          </div>
                        )}
                        {calc.units != null && (
                          <div>
                            <span className="text-white/30">Units </span>
                            <span className="text-white/60 font-medium">
                              {new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(calc.units)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-white/30">Ann. return </span>
                          <span className={cn("font-medium", calc.netAnn != null ? calc.netAnn >= 0 ? "text-emerald-400" : "text-red-400" : "text-white/30")}>
                            {calc.netAnn != null ? fmtPct(calc.netAnn) : "—"}
                          </span>
                        </div>
                        {f.start_nav != null && f.end_nav != null && (
                          <div>
                            <span className="text-white/30">NAV </span>
                            <span className="text-white/60 font-medium">
                              {f.currency} {fmt(f.start_nav, 4)} → {fmt(f.end_nav, 4)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Per-fund distribution controls (income funds only) */}
                      {(() => {
                        const meta = allFunds.find((x) => x.id === f.id);
                        const distConfig = meta?.pays_income ? FUND_DIST_CONFIG[meta.name] : null;
                        if (!distConfig) return null;
                        const distSetting = getDistForFund(f.id);
                        const plan = distConfig.planConditions?.[distSetting.freq];
                        const distPerUnitVal = parseAmount(distSetting.perUnitStr);
                        return (
                          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
                            {/* Plan selector */}
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Distribution plan</p>
                              <div className="flex flex-wrap gap-1.5">
                                {distConfig.freqOptions.map((val) => (
                                  <button
                                    key={val}
                                    onClick={() => setDistForFund(f.id, "freq", val)}
                                    className={cn(
                                      "h-7 px-3 rounded-full text-[11px] font-semibold transition border",
                                      distSetting.freq === val
                                        ? "bg-white text-black border-transparent"
                                        : "border-white/10 text-white/40 hover:text-white",
                                    )}
                                  >
                                    {distConfig.freqLabels[val]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Plan conditions */}
                            {plan && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                                <div>
                                  <span className="text-white/30">Min investment </span>
                                  <span className="text-white/60 font-medium">{fmtMoney(plan.minInitial, meta.currency ?? "TZS")}</span>
                                </div>
                                <div>
                                  <span className="text-white/30">Min top-up </span>
                                  <span className="text-white/60 font-medium">{fmtMoney(plan.minAdditional, meta.currency ?? "TZS")}</span>
                                </div>
                                {plan.exitFee && (
                                  <div>
                                    <span className="text-white/30">Exit fee </span>
                                    <span className="text-amber-400 font-medium">{plan.exitFee}</span>
                                  </div>
                                )}
                                {!plan.exitFee && (
                                  <div>
                                    <span className="text-white/30">Exit fee </span>
                                    <span className="text-emerald-400 font-medium">None</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Minimum investment warning */}
                            {plan && investAmount && investAmount < plan.minInitial && (
                              <Warning>
                                The {plan.label} requires a minimum of {fmtMoney(plan.minInitial, meta.currency ?? "TZS")}. Your investment amount is below this threshold.
                              </Warning>
                            )}

                            {/* Per-unit input (only for distribution plans) */}
                            {distSetting.freq > 0 && (
                              <div>
                                <p className="text-[10px] text-white/30 mb-1.5">Distribution per unit per payment (TZS)</p>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={distSetting.perUnitStr}
                                  onChange={(e) => setDistForFund(f.id, "perUnitStr", e.target.value)}
                                  placeholder={distConfig.defaultPerUnit || "e.g. 1.00"}
                                  className="w-full sm:w-44 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition"
                                />
                                <p className="text-[10px] text-white/25 mt-1.5">{distConfig.hint}</p>
                                {distSetting.freq > 0 && !distPerUnitVal && (
                                  <p className="text-[10px] text-amber-400/60 mt-1">Enter an amount to include distributions in the simulation.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* vs Benchmark */}
          {benchmark && funds.filter((f) => f.id !== benchmarkId).length > 0 && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
              <SectionLabel>vs {benchmark.name}</SectionLabel>
              <div className="space-y-2">
                {funds.filter((f) => f.id !== benchmarkId).map((f) => {
                  const fNet = fundCalc[f.id]?.netReturn ?? f.total_return;
                  const bNet = fundCalc[benchmark.id]?.netReturn ?? benchmark.total_return;
                  const diff = fNet != null && bNet != null ? fNet - bNet : null;
                  return (
                    <div key={f.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: FUND_COLORS[selectedIds.indexOf(f.id)] }} />
                        <span className="text-[13px] font-semibold text-white">{f.name}</span>
                      </div>
                      <span className={cn("text-[14px] font-bold",
                        diff == null ? "text-white/20" : diff >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {diff == null ? "—" : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}pp`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/20 mt-3">
                pp = percentage points over period · net of each fund's exit fee
              </p>
            </div>
          )}

          {/* Disclaimer block */}
          <div className="space-y-2">
            <Notice>
              Net Return uses current repurchase price as a proxy for exit fees over the full period. Actual exit fees may differ if you redeem at different NAV levels.
            </Notice>
            <Notice>
              For income distribution funds, distributions are modelled using a fixed per-unit rate. Actual declared distributions vary and are not guaranteed.
            </Notice>
            <Notice>
              Past performance does not guarantee future results. Always read the fund's offer document before investing.
            </Notice>
          </div>
        </>
      )}

      {!isLoading && committed && funds.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <GitCompare size={40} className="text-white/10" />
          <p className="text-[13px] text-white/30">No data found for this date range.</p>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────── */
export default function FundsPage() {
  const [activeTab, setActiveTab] = useState("monthly_return");

  const { data: allFunds = [], isFetching: listFetching, refetch: refetchList } = useGetFundsQuery();
  const { isFetching: perfFetching, refetch: refetchPerf } = useGetFundsPerformanceQuery();

  const isFetching = listFetching || perfFetching;

  const TABS = [
    { id: "all", label: "All" },
    ...PERF_TABS,
    { id: "compare", label: "Compare" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-1">
              Tanzania
            </p>
            <h1 className="text-[32px] font-black tracking-tight leading-none">
              Mutual Funds
            </h1>
          </div>
          <button
            onClick={() => { refetchList(); refetchPerf(); }}
            disabled={isFetching}
            className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/10 transition"
          >
            <RefreshCw size={16} className={cn("text-white/50", isFetching && "animate-spin")} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-9 px-4 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all border",
                activeTab === tab.id
                  ? "bg-white text-black border-transparent"
                  : "border-white/10 text-white/40 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "all" && <AllFundsTab />}
        {activeTab === "compare" && <CompareTab allFunds={allFunds} />}
        {PERF_TABS.find((t) => t.id === activeTab) && (
          <PerformanceTab
            periodKey={activeTab}
            navKey={PERF_TABS.find((t) => t.id === activeTab).navKey}
          />
        )}
      </div>
    </div>
  );
}
