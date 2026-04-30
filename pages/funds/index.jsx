import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  useGetFundsQuery,
  useGetFundsPerformanceQuery,
  useCompareFundsQuery,
} from "@/features/api/fundsApi";
import { PieChart, RefreshCw, GitCompare, X, Star } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const cn = (...c) => c.filter(Boolean).join(" ");

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "3Y", days: 365 * 3 },
  { label: "Max", days: null },
];

const TYPE_BADGE = {
  "Money Market": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Equity: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Bond: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Balanced: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Islamic: "bg-teal-500/10 text-teal-500 border-teal-500/20",
};

const PERF_TABS = [
  {
    id: "weekly_return",
    label: "Weekly",
    navKey: "week_nav",
    dateKey: "week_date",
  },
  {
    id: "monthly_return",
    label: "Monthly",
    navKey: "month_nav",
    dateKey: "month_date",
  },
  { id: "ytd_return", label: "YTD", navKey: "ytd_nav", dateKey: "ytd_date" },
];

const ALL_TABS = [
  { id: "all", label: "All Funds" },
  ...PERF_TABS,
  { id: "compare", label: "Compare" },
];

const LINE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#84cc16",
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmtNav = (v, decimals = 4) => {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(v));
};

const fmtPct = (v) => {
  if (v == null) return "—";
  const n = Number(v);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
};

const fmtAxisDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return d;
  }
};

// Outer-join all fund series on date
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

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
      </div>
    </div>
    <div className="h-4 w-12 rounded bg-muted animate-pulse" />
  </div>
);

const CustomTooltip = ({ active, payload, label, funds }) => {
  if (!active || !payload?.length) return null;
  // sort descending by value so best performer is on top
  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-xl text-[12px] min-w-[190px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">
        {fmtAxisDate(label)}
      </p>
      {sorted.map((p, i) => {
        const f = funds?.find((x) => String(x.id) === String(p.dataKey));
        const ret = (p.value ?? 100) - 100;
        return (
          <div key={p.dataKey} className={cn("flex items-center justify-between gap-3 py-0.5", i === 0 && sorted.length > 1 && "font-bold")}>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span style={{ color: p.color }} className="truncate max-w-[110px] text-[11px]">
                {f?.name ?? p.name}
              </span>
            </div>
            <span className={cn("tabular-nums text-[12px]", ret >= 0 ? "text-emerald-500" : "text-red-500")}>
              {ret >= 0 ? "+" : ""}{ret.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── PERFORMANCE TAB ────────────────────────────────────────────────────────

function PerformanceTab({ activeTab }) {
  const { data: perfFunds = [], isLoading } = useGetFundsPerformanceQuery();

  const sorted = useMemo(() => {
    if (!activeTab?.id || !perfFunds.length) return perfFunds;
    return [...perfFunds].sort(
      (a, b) => (b[activeTab.id] ?? -Infinity) - (a[activeTab.id] ?? -Infinity),
    );
  }, [perfFunds, activeTab]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card">
        {[...Array(5)].map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No performance data available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
      {sorted.map((fund, rank) => {
        const ret = fund[activeTab.id];
        const isPositive = ret != null && Number(ret) >= 0;
        return (
          <Link
            key={fund.id}
            href={`/funds/${fund.id}`}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground">
                #{rank + 1}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate leading-tight">
                  {fund.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fund.manager_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "text-[14px] font-bold",
                  ret == null
                    ? "text-muted-foreground"
                    : isPositive
                      ? "text-emerald-500"
                      : "text-red-500",
                )}
              >
                {fmtPct(ret)}
              </div>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {fund[activeTab.navKey] != null
                  ? `${fmtNav(fund[activeTab.navKey], 2)} → ${fmtNav(fund.nav_per_unit, 2)}`
                  : `NAV: ${fmtNav(fund.nav_per_unit, 2)}`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── ALL FUNDS TAB ──────────────────────────────────────────────────────────

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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([manager, items]) => (
        <div key={manager}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            {manager}
          </h3>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
            {items.map((fund) => (
              <Link
                key={fund.id}
                href={`/funds/${fund.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-3">
                  <PieChart size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-[13px] font-semibold leading-tight">
                      {fund.name}
                    </p>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border mt-1 inline-block font-medium",
                        TYPE_BADGE[fund.fund_type] || "bg-muted",
                      )}
                    >
                      {fund.fund_type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold">
                    {fund.currency} {fmtNav(fund.nav_per_unit)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPARE TAB ────────────────────────────────────────────────────────────

function CompareTab({ allFunds }) {
  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date(Date.now() - 365 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [selectedIds, setSelectedIds] = useState([]);
  const [benchmarkId, setBenchmarkId] = useState(null);
  const [fromDate, setFromDate] = useState(oneYearAgo);
  const [toDate, setToDate] = useState(today);
  const [committed, setCommitted] = useState(null);
  const [activePreset, setActivePreset] = useState("1Y");

  const canCompare = selectedIds.length >= 2 && fromDate && toDate;

  const applyPreset = (label, days) => {
    const to = today;
    const from = days
      ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      : "2000-01-01";
    setFromDate(from);
    setToDate(to);
    setActivePreset(label);
    if (selectedIds.length >= 2) {
      setCommitted({ ids: [...selectedIds], from, to });
    }
  };

  const {
    data: compareData,
    isLoading,
    isFetching,
  } = useCompareFundsQuery(
    {
      fundIds: committed?.ids ?? [],
      fromDate: committed?.from,
      toDate: committed?.to,
    },
    { skip: !committed },
  );

  const funds = compareData?.funds ?? [];
  const chartData = useMemo(
    () => (funds.length ? mergeSeriesData(funds) : []),
    [funds],
  );
  const benchmark = funds.find((f) => f.id === benchmarkId);

  const maxAbsReturn = useMemo(
    () => Math.max(...funds.map((f) => Math.abs(f.total_return ?? 0)), 0.01),
    [funds],
  );
  const topFundId = useMemo(
    () =>
      funds.reduce(
        (best, f) =>
          (f.total_return ?? -Infinity) > (best?.total_return ?? -Infinity)
            ? f
            : best,
        null,
      )?.id,
    [funds],
  );

  const toggleFund = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 10
          ? [...prev, id]
          : prev,
    );
  };

  const handleCompare = () => {
    if (!canCompare) return;
    setCommitted({ ids: [...selectedIds], from: fromDate, to: toDate });
  };

  const fmtReturn = (v) => {
    if (v == null) return <span className="text-muted-foreground">—</span>;
    const n = Number(v);
    return (
      <span className={n >= 0 ? "text-emerald-500" : "text-red-500"}>
        {n >= 0 ? "+" : ""}
        {n.toFixed(2)}%
      </span>
    );
  };

  const grouped = useMemo(() => {
    const m = {};
    allFunds.forEach((f) => {
      const key = f.manager_name || "Other";
      if (!m[key]) m[key] = [];
      m[key].push(f);
    });
    return m;
  }, [allFunds]);

  return (
    <div className="space-y-5">
      {/* Fund selector */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Select funds to compare{" "}
          <span className="normal-case font-normal">(2–10)</span>
        </p>
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([manager, mFunds]) => (
            <div key={manager}>
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">
                {manager}
              </p>
              <div className="flex flex-wrap gap-2">
                {mFunds.map((f) => {
                  const sel = selectedIds.includes(f.id);
                  const isBench = benchmarkId === f.id;
                  const colorIdx = selectedIds.indexOf(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFund(f.id)}
                      className={cn(
                        "h-8 px-3 text-[12px] font-semibold rounded-[6px] border transition flex items-center gap-1.5",
                        sel
                          ? "border-transparent text-white"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                      )}
                      style={
                        sel ? { backgroundColor: LINE_COLORS[colorIdx] } : {}
                      }
                    >
                      {isBench && <Star size={10} fill="currentColor" />}
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected chips + benchmark picker */}
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Selected — click ⭐ to set as benchmark
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id, idx) => {
                const f = allFunds.find((x) => x.id === id);
                const isBench = benchmarkId === id;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-full border text-[11px] font-semibold"
                    style={{
                      borderColor: LINE_COLORS[idx],
                      color: LINE_COLORS[idx],
                    }}
                  >
                    <button
                      onClick={() => setBenchmarkId(isBench ? null : id)}
                      title="Set as benchmark"
                    >
                      <Star
                        size={10}
                        fill={isBench ? "currentColor" : "none"}
                      />
                    </button>
                    <span>{f?.name}</span>
                    <button
                      onClick={() => {
                        setSelectedIds((p) => p.filter((x) => x !== id));
                        if (benchmarkId === id) setBenchmarkId(null);
                      }}
                      className="ml-0.5 opacity-60 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Date range + Compare button */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        {/* Quick presets */}
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground shrink-0">
            Period
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.label, p.days)}
                className={cn(
                  "h-7 px-3 text-[11px] font-bold rounded-[6px] border transition",
                  activePreset === p.label
                    ? "bg-foreground text-background border-transparent"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date inputs + Compare */}
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex gap-2 flex-1 w-full">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                From
              </p>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => { setFromDate(e.target.value); setActivePreset(null); }}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-[8px] focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                To
              </p>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={today}
                onChange={(e) => { setToDate(e.target.value); setActivePreset(null); }}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border rounded-[8px] focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
          </div>
          <button
            onClick={handleCompare}
            disabled={!canCompare || isFetching}
            className="h-9 px-5 bg-foreground text-background text-[12px] font-bold rounded-[8px] hover:opacity-80 active:scale-95 transition disabled:opacity-30 whitespace-nowrap"
          >
            {isFetching ? "Loading…" : "Compare"}
          </button>
        </div>
      </div>

      {/* Empty state before first compare */}
      {!committed && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <GitCompare size={36} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Select 2 or more funds and a date range, then hit{" "}
            <span className="font-semibold text-foreground">Compare</span>.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      )}

      {/* Results */}
      {!isLoading && funds.length > 0 && (
        <>
          {/* Chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-bold text-foreground">
                  Return since start date
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {committed?.from} → {committed?.to}
                  {benchmark && " · dashed = benchmark"}
                </p>
              </div>
              {benchmark && (
                <div className="flex items-center gap-1.5 text-[11px] border border-border rounded-lg px-2.5 py-1">
                  <div
                    className="h-2 w-4 rounded"
                    style={{
                      backgroundColor:
                        LINE_COLORS[selectedIds.indexOf(benchmark.id)],
                      opacity: 0.7,
                    }}
                  />
                  <span className="text-muted-foreground">
                    Benchmark:{" "}
                    <span className="font-semibold text-foreground">
                      {benchmark.name}
                    </span>
                  </span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.4}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtAxisDate}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    const ret = v - 100;
                    return `${ret >= 0 ? "+" : ""}${ret.toFixed(0)}%`;
                  }}
                  width={44}
                />
                <ReferenceLine
                  y={100}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
                <Tooltip content={<CustomTooltip funds={funds} />} />
                <Legend
                  formatter={(value) => {
                    const f = funds.find((x) => String(x.id) === String(value));
                    return (
                      <span style={{ fontSize: 11 }}>{f?.name ?? value}</span>
                    );
                  }}
                />
                {benchmark && (
                  <Line
                    type="monotone"
                    dataKey={String(benchmark.id)}
                    stroke={LINE_COLORS[selectedIds.indexOf(benchmark.id)]}
                    strokeWidth={2.5}
                    dot={false}
                    strokeDasharray="6 3"
                    name={String(benchmark.id)}
                  />
                )}
                {funds
                  .filter((f) => f.id !== benchmarkId)
                  .map((f) => (
                    <Line
                      key={f.id}
                      type="monotone"
                      dataKey={String(f.id)}
                      stroke={LINE_COLORS[selectedIds.indexOf(f.id)]}
                      strokeWidth={2}
                      dot={false}
                      name={String(f.id)}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Returns table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                      Fund
                    </th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">
                      Start NAV
                    </th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">
                      End NAV
                    </th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">
                      Total Return
                    </th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                      Annualized
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...funds]
                    .sort(
                      (a, b) =>
                        (b.total_return ?? -Infinity) -
                        (a.total_return ?? -Infinity),
                    )
                    .map((f, rank) => {
                      const isBench = f.id === benchmarkId;
                      const isTop = f.id === topFundId;
                      const color = LINE_COLORS[selectedIds.indexOf(f.id)];
                      const barPct =
                        f.total_return != null
                          ? (Math.abs(f.total_return) / maxAbsReturn) * 100
                          : 0;
                      return (
                        <tr
                          key={f.id}
                          className={cn(
                            "border-b border-border last:border-0",
                            isTop
                              ? "bg-emerald-500/5"
                              : rank % 2 === 0
                                ? "bg-card"
                                : "bg-muted/20",
                          )}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-semibold">{f.name}</span>
                              {isTop && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-500/30 bg-emerald-500/10 rounded px-1">
                                  top
                                </span>
                              )}
                              {isBench && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded px-1">
                                  benchmark
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground ml-[18px]">
                              {f.manager_name}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">
                            {f.start_nav != null
                              ? `${f.currency} ${Number(f.start_nav).toFixed(4)}`
                              : "—"}
                            {f.start_date && (
                              <div className="text-[10px]">
                                {fmtAxisDate(f.start_date)}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold">
                            {f.end_nav != null
                              ? `${f.currency} ${Number(f.end_nav).toFixed(4)}`
                              : "—"}
                            {f.end_date && (
                              <div className="text-[10px] text-muted-foreground">
                                {fmtAxisDate(f.end_date)}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold relative">
                            {f.total_return != null && (
                              <div
                                className="absolute inset-y-0 left-0 rounded-r"
                                style={{
                                  width: `${barPct}%`,
                                  backgroundColor:
                                    f.total_return >= 0
                                      ? "#10b981"
                                      : "#ef4444",
                                  opacity: 0.12,
                                }}
                              />
                            )}
                            <span className="relative z-10">
                              {fmtReturn(f.total_return)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold">
                            {fmtReturn(f.annualized_return)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* vs Benchmark */}
          {benchmark &&
            funds.filter((f) => f.id !== benchmarkId).length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  vs {benchmark.name} (benchmark)
                </p>
                <div className="flex flex-col divide-y divide-border">
                  {funds
                    .filter((f) => f.id !== benchmarkId)
                    .map((f) => {
                      const diff =
                        f.total_return != null && benchmark.total_return != null
                          ? f.total_return - benchmark.total_return
                          : null;
                      const color = LINE_COLORS[selectedIds.indexOf(f.id)];
                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[13px] font-semibold">
                              {f.name}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[14px] font-bold",
                              diff == null
                                ? "text-muted-foreground"
                                : diff >= 0
                                  ? "text-emerald-500"
                                  : "text-red-500",
                            )}
                          >
                            {diff == null
                              ? "—"
                              : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}pp`}
                          </span>
                        </div>
                      );
                    })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  pp = percentage points over the period
                </p>
              </div>
            )}
        </>
      )}

      {/* No data for selected range */}
      {!isLoading && committed && funds.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <GitCompare size={36} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No data found for this date range.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function FundsPage() {
  const [activeTabId, setActiveTabId] = useState("monthly_return");

  const {
    data: allFunds = [],
    isFetching: listFetching,
    refetch: refetchList,
  } = useGetFundsQuery();
  const { isFetching: perfFetching, refetch: refetchPerf } =
    useGetFundsPerformanceQuery();

  const activeTab = useMemo(
    () => ALL_TABS.find((t) => t.id === activeTabId),
    [activeTabId],
  );
  const isFetching = listFetching || perfFetching;

  const handleRefresh = () => {
    refetchList();
    refetchPerf();
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Investment
            </p>
            <h1 className="text-2xl font-black tracking-tight">Mutual Funds</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2 hover:bg-muted rounded-full transition"
          >
            <RefreshCw
              size={20}
              className={cn(isFetching && "animate-spin text-muted-foreground")}
            />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 overflow-x-auto no-scrollbar">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "flex-1 min-w-[85px] py-2 text-[11px] font-bold rounded-lg transition whitespace-nowrap",
                activeTabId === tab.id
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        {activeTabId === "all" ? (
          <AllFundsTab />
        ) : activeTabId === "compare" ? (
          <CompareTab allFunds={allFunds} />
        ) : activeTab ? (
          <PerformanceTab activeTab={activeTab} />
        ) : null}
      </div>
    </div>
  );
}
