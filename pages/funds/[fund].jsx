import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/router";
import {
  Star,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  Bell,
  AlertCircle,
  Lock,
  Info,
  ExternalLink,
} from "lucide-react";

import { FinancialChart } from "@/components/ui/FinancialChart";
import { useGetFundPricesQuery } from "@/features/api/fundsApi";

/* ================================ CONSTANTS ============================== */
const PERIODS = ["1M", "3M", "6M", "1Y", "3Y", "Max"];
const MAX_LIMIT = 500; // backend currently enforces le: 500 (code supports le: 5000, needs restart)
const DAY_MS = 86_400_000;
const DRAG_OVERLAY_TIMEOUT = 4000;

/* ================================ UTILS ================================== */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const fmt = (value, { decimals = 2, compact = false } = {}) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  if (compact)
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(num);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

const fmtPct = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
};

const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Proper CAGR annualization
const annualize = (totalReturnPct, years) => {
  if (totalReturnPct == null || !years || years <= 0) return null;
  const factor = 1 + totalReturnPct / 100;
  if (factor <= 0) return null;
  return (Math.pow(factor, 1 / years) - 1) * 100;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
};

const isFee = (v) => {
  if (v === null || v === undefined || v === "") return false;
  const str = String(v).trim().toLowerCase();
  if (["none", "no", "n/a", "0", "0%", "0.0", "0.00"].includes(str)) {
    return false;
  }
  const numeric = Number(str.replace("%", ""));
  if (!Number.isNaN(numeric) && numeric === 0) return false;
  return true;
};

const formatFee = (v) => (isFee(v) ? v : "None");

/* ========================== SHARED COMPONENTS ============================ */
const Spinner = ({ large = false }) => (
  <div className={large ? "relative w-12 h-12" : "relative w-8 h-8"}>
    <div
      className={cn(
        "border-2 border-white/10 rounded-full",
        large ? "w-12 h-12" : "w-8 h-8",
      )}
    />
    <div
      className={cn(
        "absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin",
        large ? "w-12 h-12" : "w-8 h-8",
      )}
    />
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center space-y-4">
      <Spinner large />
      <p className="text-white/50 text-sm">Loading fund data…</p>
    </div>
  </div>
);

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
      active
        ? "text-white border-white"
        : "text-white/40 border-transparent hover:text-white/70",
    )}
  >
    {label}
  </button>
);

const TimeBtn = ({ range, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-2 text-sm font-medium transition-colors",
      active ? "text-white" : "text-white/40 hover:text-white/70",
    )}
  >
    {range}
    {active && <div className="h-0.5 bg-white mt-1 rounded-full" />}
  </button>
);

const FactRow = ({ label, value, accent, icon }) => (
  <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
    <span className="text-white/40 text-sm shrink-0 flex items-center gap-1.5">
      {icon}
      {label}
    </span>
    <span
      className={cn(
        "text-sm font-medium text-right break-words",
        accent || "text-white",
      )}
    >
      {value || "—"}
    </span>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
    {children}
  </p>
);

const PerfRow = ({ label, value }) => {
  const display = fmtPct(value);
  const pos = value != null && Number(value) >= 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-white/50 text-sm">{label}</span>
      <span
        className={cn(
          "font-semibold text-sm",
          display == null
            ? "text-white/30"
            : pos
              ? "text-emerald-400"
              : "text-red-400",
        )}
      >
        {display ?? "—"}
      </span>
    </div>
  );
};

const AllocationBar = ({ label, pct, color = "bg-white" }) => (
  <div className="mb-3 last:mb-0">
    <div className="flex justify-between text-xs text-white/50 mb-1">
      <span>{label}</span>
      <span>{pct}%</span>
    </div>
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full", color)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  </div>
);

const FAQRow = ({ item }) => (
  <div className="border border-white/10 rounded-xl p-5">
    <p className="text-sm font-semibold text-white mb-2">{item.question}</p>
    <p className="text-sm text-white/60 leading-relaxed">{item.answer}</p>
  </div>
);

/* ========================== PROFIT OVERLAY ================================ */
const ProfitOverlay = ({ startPoint, endPoint, containerRef, chartData }) => {
  if (!startPoint || !endPoint || !chartData.length || !containerRef.current)
    return null;
  const rect = containerRef.current.getBoundingClientRect();
  const startX = startPoint.x - rect.left;
  const endX = endPoint.x - rect.left;
  const left = Math.min(startX, endX);
  const width = Math.abs(startX - endX);
  if (width < 10) return null;

  const posAt = (clientX) => {
    const rel = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.round(rel * (chartData.length - 1));
    return { ...chartData[idx], index: idx };
  };

  const ptA = posAt(startPoint.x);
  const ptB = posAt(endPoint.x);
  if (!ptA?.value || !ptB?.value) return null;

  const earlier = ptA.index <= ptB.index ? ptA : ptB;
  const later = ptA.index > ptB.index ? ptA : ptB;
  const diff = later.value - earlier.value;
  const pct = earlier.value !== 0 ? (diff / earlier.value) * 100 : 0;
  const pos = diff >= 0;

  const period = (() => {
    if (!earlier.date || !later.date) return "";
    const days = Math.ceil(
      (new Date(later.date) - new Date(earlier.date)) / DAY_MS,
    );
    if (days === 0) return "Same day";
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}yr`;
  })();

  return (
    <>
      <div
        className={cn(
          "absolute top-0 bottom-0 pointer-events-none z-10",
          pos ? "bg-emerald-500/5" : "bg-red-500/5",
        )}
        style={{ left, width }}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-px",
            pos ? "bg-emerald-500/30" : "bg-red-500/30",
          )}
        />
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-px",
            pos ? "bg-emerald-500/30" : "bg-red-500/30",
          )}
        />
      </div>
      <div
        className="absolute z-20 pointer-events-none"
        style={{
          left: left + width / 2,
          top: 24,
          transform: "translateX(-50%)",
        }}
      >
        <div className="bg-white text-black rounded-lg shadow-2xl overflow-hidden min-w-[160px]">
          <div className="p-4 text-center">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">
              {pos ? "Profit" : "Loss"}
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                pos ? "text-emerald-600" : "text-red-600",
              )}
            >
              {fmtPct(pct)}
            </p>
            <p className="text-xs text-black/40 mt-1">
              {fmtDate(earlier.date)} → {fmtDate(later.date)} · {period}
            </p>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
      </div>
    </>
  );
};

/* ========================== DRAGGABLE CHART (extracted) ================== */
const DraggableChart = ({
  chartData,
  chartLoading,
  ccy,
  navPerUnit,
  height = "h-[300px] sm:h-[400px]",
}) => {
  const ref = useRef(null);
  const timeoutRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // cleanup pending timeouts on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const getPoint = (e) => {
    if (e.touches && e.touches[0])
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const onStart = useCallback((e) => {
    e.preventDefault();
    const pt = getPoint(e);
    setDragStart(pt);
    setDragEnd(pt);
    setIsDragging(true);
  }, []);

  const onMove = useCallback(
    (e) => {
      if (isDragging) setDragEnd(getPoint(e));
    },
    [isDragging],
  );

  const onEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setDragStart(null);
        setDragEnd(null);
      }, DRAG_OVERLAY_TIMEOUT);
    }
  }, [isDragging]);

  return (
    <div
      ref={ref}
      className={cn("relative cursor-crosshair select-none touch-none", height)}
      onMouseDown={onStart}
      onMouseMove={onMove}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
    >
      {chartLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      ) : chartData.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/30">No price data available</p>
        </div>
      ) : (
        <>
          <FinancialChart
            data={chartData}
            currentValue={navPerUnit}
            isLoading={chartLoading}
            formatter={(v) => `${ccy} ${fmt(v, { decimals: 4 })}`}
            className="absolute inset-0"
            lineColor="#ffffff"
            gridColor="rgba(255,255,255,0.05)"
          />
          <ProfitOverlay
            startPoint={dragStart}
            endPoint={dragEnd}
            containerRef={ref}
            chartData={chartData}
          />
        </>
      )}
    </div>
  );
};

/* ============================== MAIN PAGE ================================= */
const FundPage = () => {
  const router = useRouter();
  const rawIdentifier = router.query.fund;

  const identifier = useMemo(() => {
    if (!rawIdentifier) return null;
    return Array.isArray(rawIdentifier) ? rawIdentifier[0] : rawIdentifier;
  }, [rawIdentifier]);

  const [timeRange, setTimeRange] = useState("1Y");
  const [tab, setTab] = useState("overview");
  const [starred, setStarred] = useState(false);
  const [investAmt, setInvestAmt] = useState("");

  /* ── API: chart data for selected period ── */
  const {
    data: fund,
    isLoading,
    isError,
    isFetching,
  } = useGetFundPricesQuery(
    { identifier, period: timeRange, page: 1, limit: MAX_LIMIT },
    { skip: !identifier },
  );

  /* ── API: full history for accurate performance metrics ── */
  const { data: fullFund } = useGetFundPricesQuery(
    { identifier, period: "Max", page: 1, limit: 500 },
    { skip: !identifier },
  );

  // Backend embeds fund_data.json info directly on the fund response
  const info = fund?.info ?? null;

  /* ── CHART DATA (sorted ascending, for selected period) ── */
  const chartData = useMemo(() => {
    if (!fund?.prices) return [];
    return [...fund.prices]
      .filter((p) => p.nav_per_unit != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((p) => ({ date: p.date, value: Number(p.nav_per_unit) }));
  }, [fund]);

  /* ── FULL CHART DATA (sorted ascending, for performance metrics) ── */
  const fullChartData = useMemo(() => {
    if (!fullFund?.prices) return [];
    return [...fullFund.prices]
      .filter((p) => p.nav_per_unit != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((p) => ({ date: p.date, value: Number(p.nav_per_unit) }));
  }, [fullFund]);

  /* ── PERFORMANCE METRICS (computed from full chart data) ── */
  const perf = useMemo(() => {
    if (!fullChartData.length) return {};
    const sorted = fullChartData;
    const latest = sorted.at(-1).value;
    const latestD = new Date(sorted.at(-1).date);

    const navBefore = (d) => {
      const filtered = sorted.filter((p) => new Date(p.date) <= d);
      return filtered.length ? filtered.at(-1).value : null;
    };
    const pct = (old) =>
      old && old !== 0 ? ((latest - old) / old) * 100 : null;
    const ago = (days) => new Date(latestD - days * DAY_MS);

    const ytdRet = pct(navBefore(new Date(latestD.getFullYear(), 0, 1)));
    const oneYRet = pct(navBefore(ago(365)));
    const threeYRet = pct(navBefore(ago(365 * 3)));
    const incRet = pct(sorted[0].value);

    return {
      ytd: ytdRet,
      one_y: oneYRet,
      three_y_total: threeYRet,
      three_y_ann: annualize(threeYRet, 3),
      inception: incRet,
      first_date: sorted[0].date,
      last_date: sorted.at(-1).date,
      total_points: sorted.length,
    };
  }, [fullChartData]);

  /* ── DAY-OVER-DAY NAV CHANGE (from chart data, not bid-ask spread) ── */
  const { navChange, navChangePct, up } = useMemo(() => {
    if (chartData.length < 2)
      return { navChange: null, navChangePct: null, up: true };
    const latest = chartData.at(-1).value;
    const prev = chartData.at(-2).value;
    const change = latest - prev;
    return {
      navChange: change,
      navChangePct: prev ? (change / prev) * 100 : null,
      up: change >= 0,
    };
  }, [chartData]);

  /* ── DESTRUCTURED FIELDS (with sensible defaults) ── */
  const {
    nav_per_unit,
    sale_price,
    repurchase_price,
    name = "Fund",
    fund_type,
    manager_name,
    currency = "TZS",
    entry_load,
    exit_load,
    min_initial,
    min_additional,
    redemption_days,
    pays_income,
    income_frequency,
    benchmark,
  } = fund || {};

  const ccy = info?.currency || currency || "TZS";
  const minInvest = info?.min_initial ?? min_initial;
  const minAdditional = info?.min_additional ?? min_additional;

  const quickAmounts =
    ccy === "USD" ? [500, 1000, 5000, 10000] : [50000, 100000, 500000, 1000000];

  /* ── Parsed numeric invest amount (handles commas) ── */
  const numericAmt = useMemo(() => {
    const cleaned = String(investAmt).replace(/,/g, "");
    return cleaned ? Number(cleaned) : null;
  }, [investAmt]);

  const minInvestNum = useMemo(() => toNumber(minInvest), [minInvest]);

  const belowMin =
    numericAmt != null && minInvestNum != null && numericAmt < minInvestNum;

  /* ── RENDER GUARDS ── */
  if (isLoading) return <LoadingState />;

  if (isError || !fund)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-white/50" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            Unable to load fund
          </h2>
          <p className="text-white/50 text-sm">
            Please check your connection and try again.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/30 mb-8">
          <button
            onClick={() => router.push("/funds")}
            className="hover:text-white/60 transition-colors"
          >
            Funds
          </button>
          <ChevronRight size={14} />
          <span className="text-white/50">{name}</span>
        </nav>

        {/* ===== HEADER ===== */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {fund_type && (
                  <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                    {fund_type}
                  </span>
                )}
                {ccy === "USD" && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                    USD
                  </span>
                )}
                {info?.risk_level && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      info.risk_level.toLowerCase().includes("low")
                        ? "bg-emerald-500/15 text-emerald-400"
                        : /medium|moderate/.test(info.risk_level.toLowerCase())
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-red-500/15 text-red-400",
                    )}
                  >
                    {info.risk_level} Risk
                  </span>
                )}
                {info?.other_facts?.fund_structure && (
                  <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/40">
                    {info.other_facts.fund_structure}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                {name}
              </h1>
              <p className="text-white/40 text-sm">
                {manager_name || info?.manager}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStarred(!starred)}
                className={cn(
                  "p-3 rounded-full border transition-all",
                  starred
                    ? "bg-white text-black border-white"
                    : "border-white/20 text-white/50 hover:text-white hover:border-white/40",
                )}
                aria-label="Star fund"
              >
                <Star size={18} fill={starred ? "currentColor" : "none"} />
              </button>
              <button
                className="p-3 rounded-full border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
              <button
                className="p-3 rounded-full border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all"
                aria-label="Share"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* NAV Block */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                NAV Per Unit
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  {fmt(nav_per_unit, { decimals: 4 })}
                </span>
                <span className="text-lg text-white/40">{ccy}</span>
              </div>
              {navChange != null && (
                <div
                  className={cn(
                    "flex items-center gap-2 mt-2 text-base font-medium",
                    up ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {up ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                  <span>{fmt(Math.abs(navChange), { decimals: 4 })}</span>
                  {navChangePct != null && (
                    <span>({fmtPct(navChangePct)})</span>
                  )}
                  <span className="text-xs text-white/40">
                    vs. previous close
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                  Sale Price
                </p>
                <p className="text-xl font-semibold">
                  {sale_price ? fmt(sale_price, { decimals: 4 }) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                  YTD Return
                </p>
                <p
                  className={cn(
                    "text-xl font-semibold",
                    perf.ytd != null
                      ? perf.ytd >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                      : "",
                  )}
                >
                  {fmtPct(perf.ytd) ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ===== KEY STATS BAND ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-white/10 rounded-xl mb-10 divide-x divide-y lg:divide-y-0 divide-white/10">
          {[
            {
              label: "NAV / Unit",
              value: nav_per_unit
                ? `${ccy} ${fmt(nav_per_unit, { decimals: 4 })}`
                : "—",
            },
            {
              label: "Sale Price",
              value: sale_price
                ? `${ccy} ${fmt(sale_price, { decimals: 4 })}`
                : "—",
            },
            {
              label: "Repurchase",
              value: repurchase_price
                ? `${ccy} ${fmt(repurchase_price, { decimals: 4 })}`
                : "—",
            },
            {
              label: "Exit Fee",
              value: formatFee(info?.exit_load || exit_load),
              accent: isFee(info?.exit_load || exit_load)
                ? "text-red-400"
                : "text-emerald-400",
            },
          ].map(({ label, value, accent }) => (
            <div key={label} className="p-4 sm:p-6">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
                {label}
              </p>
              <p
                className={cn(
                  "text-xl sm:text-2xl font-semibold tracking-tight",
                  accent || "text-white",
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ===== TABS ===== */}
        <div className="flex items-center border-b border-white/10 mb-10 overflow-x-auto">
          {["overview", "performance", "details", "about", "faqs"].map((t) => (
            <TabButton
              key={t}
              label={t === "faqs" ? "FAQs" : t.charAt(0).toUpperCase() + t.slice(1)}
              active={tab === t}
              onClick={() => setTab(t)}
            />
          ))}
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* ---- LEFT COLUMN ---- */}
          <div className="lg:col-span-2 space-y-12">
            {/* OVERVIEW TAB */}
            {tab === "overview" && (
              <>
                <section>
                  <div className="flex items-center gap-1 mb-6 border-b border-white/10 overflow-x-auto">
                    {PERIODS.map((r) => (
                      <TimeBtn
                        key={r}
                        range={r}
                        active={timeRange === r}
                        onClick={() => setTimeRange(r)}
                      />
                    ))}
                  </div>
                  <DraggableChart
                    chartData={chartData}
                    chartLoading={isFetching}
                    ccy={ccy}
                    navPerUnit={nav_per_unit}
                  />
                  <p className="text-xs text-white/30 mt-3 text-center">
                    Drag across the chart to measure returns between two dates
                  </p>
                </section>

                <section>
                  <SectionLabel>Performance Snapshot</SectionLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "YTD", value: perf.ytd },
                      { label: "1 Year", value: perf.one_y },
                      { label: "Since Inception", value: perf.inception },
                    ].map(({ label, value }) => {
                      const display = fmtPct(value);
                      const pos = value != null && Number(value) >= 0;
                      return (
                        <div
                          key={label}
                          className="border border-white/10 rounded-xl p-4"
                        >
                          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
                            {label}
                          </p>
                          <p
                            className={cn(
                              "text-2xl font-semibold",
                              display == null
                                ? "text-white/30"
                                : pos
                                  ? "text-emerald-400"
                                  : "text-red-400",
                            )}
                          >
                            {display ?? "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {info && (
                  <section>
                    <SectionLabel>About</SectionLabel>
                    <div className="border border-white/10 rounded-xl p-6 space-y-5">
                      {info.objective && (
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
                            Objective
                          </p>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {info.objective}
                          </p>
                        </div>
                      )}
                      {info.suitable_for && (
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
                            Suitable For
                          </p>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {info.suitable_for}
                          </p>
                        </div>
                      )}
                      {info.why_choose?.length > 0 && (
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wide mb-3">
                            Why Choose This Fund
                          </p>
                          <ul className="space-y-2">
                            {info.why_choose.map((reason, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-3 text-sm text-white/70"
                              >
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* PERFORMANCE TAB */}
            {tab === "performance" && (
              <>
                <section>
                  <div className="flex items-center gap-1 mb-6 border-b border-white/10 overflow-x-auto">
                    {PERIODS.map((r) => (
                      <TimeBtn
                        key={r}
                        range={r}
                        active={timeRange === r}
                        onClick={() => setTimeRange(r)}
                      />
                    ))}
                  </div>
                  <DraggableChart
                    chartData={chartData}
                    chartLoading={isFetching}
                    ccy={ccy}
                    navPerUnit={nav_per_unit}
                    height="h-[300px] sm:h-[360px]"
                  />
                  <p className="text-xs text-white/30 mt-3 text-center">
                    Drag to calculate returns between dates
                  </p>
                </section>

                <section>
                  <SectionLabel>Historical Returns</SectionLabel>
                  <div className="border border-white/10 rounded-xl p-6">
                    <PerfRow label="Year to Date (YTD)" value={perf.ytd} />
                    <PerfRow label="1 Year" value={perf.one_y} />
                    <PerfRow
                      label="3 Years (Total)"
                      value={perf.three_y_total}
                    />
                    <PerfRow
                      label="3 Years (Annualized)"
                      value={perf.three_y_ann}
                    />
                    <PerfRow
                      label="Since Inception (Total)"
                      value={perf.inception}
                    />
                  </div>
                  {perf.first_date && (
                    <p className="text-xs text-white/30 mt-3 text-center">
                      Data from {fmtDate(perf.first_date)} to{" "}
                      {fmtDate(perf.last_date)} · {perf.total_points} data
                      points
                    </p>
                  )}
                  <div className="mt-4 p-4 bg-white/5 rounded-lg flex gap-3">
                    <Info size={14} className="text-white/30 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/40 leading-relaxed">
                      Returns are computed from daily NAV data. Annualized
                      figures use compound annual growth rate (CAGR). Past
                      performance does not guarantee future results.
                    </p>
                  </div>
                </section>

                {(info?.benchmark || benchmark) && (
                  <section>
                    <SectionLabel>Benchmark</SectionLabel>
                    <div className="border border-white/10 rounded-xl p-5">
                      <p className="text-white/70 text-sm">
                        {info?.benchmark || benchmark}
                      </p>
                    </div>
                  </section>
                )}

                {/* Projected returns */}
                {(info?.other_facts?.projected_returns ||
                  info?.other_facts?.illustrated_return_rate) && (
                  <section>
                    <SectionLabel>
                      Projected / Illustrative Returns
                    </SectionLabel>
                    <div className="border border-white/10 rounded-xl p-6 space-y-2">
                      {info.other_facts.projected_returns && (
                        <p className="text-sm text-white/70">
                          Projected:{" "}
                          <span className="text-white font-semibold">
                            {info.other_facts.projected_returns}
                          </span>
                        </p>
                      )}
                      {info.other_facts.illustrated_return_rate && (
                        <p className="text-sm text-white/70">
                          Illustrated rate:{" "}
                          <span className="text-white font-semibold">
                            {info.other_facts.illustrated_return_rate}
                          </span>
                        </p>
                      )}
                      {info.other_facts.example && (
                        <p className="text-xs text-white/40 leading-relaxed mt-2">
                          {info.other_facts.example}
                        </p>
                      )}
                      {info.other_facts.example_return && (
                        <p className="text-xs text-white/40 leading-relaxed mt-2">
                          {info.other_facts.example_return}
                        </p>
                      )}
                      {info.other_facts.distribution_example && (
                        <p className="text-xs text-white/40 leading-relaxed mt-2">
                          {info.other_facts.distribution_example}
                        </p>
                      )}
                      <p className="text-xs text-white/30 italic pt-2">
                        Illustrative only. Not a guarantee of future returns.
                      </p>
                    </div>
                  </section>
                )}
              </>
            )}

            {/* DETAILS TAB */}
            {tab === "details" && (
              <>
                {/* Fees & Terms */}
                <section>
                  <SectionLabel>Fees & Terms</SectionLabel>
                  <div className="border border-white/10 rounded-xl p-6">
                    <FactRow
                      label="Entry Fee"
                      value={formatFee(info?.entry_load || entry_load)}
                      accent={
                        isFee(info?.entry_load || entry_load)
                          ? "text-red-400"
                          : "text-emerald-400"
                      }
                    />
                    <FactRow
                      label="Exit Fee"
                      value={formatFee(info?.exit_load || exit_load)}
                      accent={
                        isFee(info?.exit_load || exit_load)
                          ? "text-red-400"
                          : "text-emerald-400"
                      }
                    />
                    <FactRow
                      label="Management Fee"
                      value={info?.management_fee}
                    />
                    {info?.other_facts?.custodian_fee && (
                      <FactRow
                        label="Custodian Fee"
                        value={info.other_facts.custodian_fee}
                      />
                    )}
                    <FactRow
                      label="Min. Initial"
                      value={
                        minInvest
                          ? `${ccy} ${fmt(minInvest)}`
                          : info?.min_initial_note
                      }
                    />
                    <FactRow
                      label="Min. Additional"
                      value={
                        minAdditional ? `${ccy} ${fmt(minAdditional)}` : null
                      }
                    />
                    {info?.other_facts?.min_withdrawal && (
                      <FactRow
                        label="Min. Withdrawal"
                        value={`${ccy} ${fmt(info.other_facts.min_withdrawal)}`}
                      />
                    )}
                    {info?.other_facts?.min_redemption_usd && (
                      <FactRow
                        label="Min. Redemption"
                        value={`USD ${fmt(info.other_facts.min_redemption_usd)}`}
                      />
                    )}
                    {info?.other_facts?.min_balance_to_maintain && (
                      <FactRow
                        label="Min. Balance"
                        value={`${ccy} ${fmt(info.other_facts.min_balance_to_maintain)}`}
                      />
                    )}
                    {info?.other_facts?.lock_in_days && (
                      <FactRow
                        label="Lock-in Period"
                        value={`${info.other_facts.lock_in_days} days`}
                        accent="text-amber-400"
                        icon={<Lock size={12} />}
                      />
                    )}
                    <FactRow
                      label="Redemption Settlement"
                      value={
                        (info?.redemption_days ?? redemption_days)
                          ? `T+${info?.redemption_days ?? redemption_days} days`
                          : null
                      }
                    />
                    <FactRow
                      label="Income Distribution"
                      value={
                        (info?.pays_income ?? pays_income)
                          ? `Yes — ${info?.income_frequency || income_frequency || ""}`
                          : "No"
                      }
                    />
                  </div>
                </section>

                {/* Investment Plans */}
                {info?.investment_plans?.length > 0 && (
                  <section>
                    <SectionLabel>Investment Plans</SectionLabel>
                    <div className="space-y-3">
                      {info.investment_plans.map((plan, i) => (
                        <div
                          key={i}
                          className="border border-white/10 rounded-xl p-5"
                        >
                          <h4 className="font-semibold text-white mb-1">
                            {plan.name}
                          </h4>
                          <p className="text-sm text-white/60 mb-3">
                            {plan.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs">
                            {plan.min_initial && (
                              <span className="text-white/50">
                                Min. Initial:{" "}
                                <span className="text-white font-medium">
                                  {ccy} {fmt(plan.min_initial)}
                                </span>
                              </span>
                            )}
                            {plan.min_additional && (
                              <span className="text-white/50">
                                Min. Additional:{" "}
                                <span className="text-white font-medium">
                                  {ccy} {fmt(plan.min_additional)}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Fund Structure */}
                <section>
                  <SectionLabel>Fund Structure</SectionLabel>
                  <div className="border border-white/10 rounded-xl p-6">
                    <FactRow
                      label="Manager"
                      value={manager_name || info?.manager}
                    />
                    <FactRow label="Trustee" value={info?.trustee} />
                    <FactRow label="Custodian" value={info?.custodian} />
                    <FactRow label="Auditor" value={info?.auditor} />
                    <FactRow
                      label="Fund Type"
                      value={fund_type || info?.fund_type}
                    />
                    <FactRow label="Currency" value={ccy} />
                    <FactRow label="Inception" value={info?.inception_date} />
                    {(info?.benchmark || benchmark) && (
                      <FactRow
                        label="Benchmark"
                        value={info?.benchmark || benchmark}
                      />
                    )}
                    {info?.other_facts?.cmsa_certificate && (
                      <FactRow
                        label="CMSA Certificate"
                        value={info.other_facts.cmsa_certificate}
                      />
                    )}
                    {info?.other_facts?.cmsa_issue_date && (
                      <FactRow
                        label="CMSA Issue Date"
                        value={info.other_facts.cmsa_issue_date}
                      />
                    )}
                    {info?.other_facts?.fund_structure && (
                      <FactRow
                        label="Structure"
                        value={info.other_facts.fund_structure}
                      />
                    )}
                    {info?.other_facts?.regulator && (
                      <FactRow
                        label="Regulator"
                        value={info.other_facts.regulator}
                      />
                    )}
                  </div>
                </section>

                {/* Asset Allocation */}
                {info?.asset_allocation && (
                  <section>
                    <SectionLabel>Asset Allocation</SectionLabel>
                    <div className="border border-white/10 rounded-xl p-6">
                      {typeof info.asset_allocation.usd_denominated_min_pct ===
                      "number" ? (
                        <>
                          <AllocationBar
                            label="USD-Denominated Assets (min)"
                            pct={info.asset_allocation.usd_denominated_min_pct}
                            color="bg-blue-400"
                          />
                          <AllocationBar
                            label="TZS Fixed Income (max)"
                            pct={info.asset_allocation.tzs_denominated_max_pct}
                            color="bg-white/50"
                          />
                        </>
                      ) : typeof info.asset_allocation.money_market ===
                        "number" ? (
                        <AllocationBar
                          label="Money Market"
                          pct={info.asset_allocation.money_market}
                          color="bg-emerald-400"
                        />
                      ) : null}
                      {info.asset_allocation.note && (
                        <p className="text-xs text-white/40 mt-4 leading-relaxed">
                          {info.asset_allocation.note}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {/* Insurance Benefits (Wekeza Maisha) */}
                {info?.other_facts?.insurance_benefits?.length > 0 && (
                  <section>
                    <SectionLabel>Insurance Benefits</SectionLabel>
                    <div className="border border-white/10 rounded-xl p-6">
                      <ul className="space-y-2 mb-4">
                        {info.other_facts.insurance_benefits.map((b, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm text-white/70"
                          >
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                      {info.other_facts.insurance_cap_tzs && (
                        <p className="text-xs text-white/40">
                          Coverage cap:{" "}
                          <span className="text-white font-medium">
                            TZS {fmt(info.other_facts.insurance_cap_tzs)}
                          </span>
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {/* Payment Details (iDollar) */}
                {(info?.other_facts?.payment_bank ||
                  info?.collection_account) && (
                  <section>
                    <SectionLabel>Payment / Collection Details</SectionLabel>
                    <div className="border border-white/10 rounded-xl p-6">
                      <FactRow
                        label="Bank"
                        value={
                          info.collection_account?.bank ||
                          info.other_facts?.payment_bank
                        }
                      />
                      {info.collection_account?.branch && (
                        <FactRow
                          label="Branch"
                          value={info.collection_account.branch}
                        />
                      )}
                      {info.collection_account?.account_name && (
                        <FactRow
                          label="Account Name"
                          value={info.collection_account.account_name}
                        />
                      )}
                      <FactRow
                        label="Account Number"
                        value={
                          info.collection_account?.account_number ||
                          info.other_facts?.payment_account
                        }
                      />
                      {(info.collection_account?.swift ||
                        info.other_facts?.payment_swift) && (
                        <FactRow
                          label="SWIFT"
                          value={
                            info.collection_account?.swift ||
                            info.other_facts?.payment_swift
                          }
                        />
                      )}
                    </div>
                  </section>
                )}

                {/* Investment Channels */}
                {info?.other_facts?.investment_channels?.length > 0 && (
                  <section>
                    <SectionLabel>Investment Channels</SectionLabel>
                    <div className="border border-white/10 rounded-xl p-6">
                      <div className="flex flex-wrap gap-2">
                        {info.other_facts.investment_channels.map((ch) => (
                          <span
                            key={ch}
                            className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/60"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ABOUT TAB */}
            {tab === "about" && (
              <>
                {info ? (
                  <>
                    {info.objective && (
                      <section>
                        <SectionLabel>Objective</SectionLabel>
                        <div className="border border-white/10 rounded-xl p-6">
                          <p className="text-white/70 text-sm leading-relaxed">
                            {info.objective}
                          </p>
                        </div>
                      </section>
                    )}
                    {info.strategy && (
                      <section>
                        <SectionLabel>Investment Strategy</SectionLabel>
                        <div className="border border-white/10 rounded-xl p-6">
                          <p className="text-white/70 text-sm leading-relaxed">
                            {info.strategy}
                          </p>
                        </div>
                      </section>
                    )}
                    {info.suitable_for && (
                      <section>
                        <SectionLabel>Suitable For</SectionLabel>
                        <div className="border border-white/10 rounded-xl p-6">
                          <p className="text-white/70 text-sm leading-relaxed">
                            {info.suitable_for}
                          </p>
                        </div>
                      </section>
                    )}
                    {info.other_facts?.permitted_investments?.length > 0 && (
                      <section>
                        <SectionLabel>Permitted Investments</SectionLabel>
                        <div className="border border-white/10 rounded-xl p-6">
                          <ul className="space-y-2">
                            {info.other_facts.permitted_investments.map(
                              (item) => (
                                <li
                                  key={item}
                                  className="flex items-start gap-3 text-sm text-white/60"
                                >
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-white/30 shrink-0" />
                                  {item}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </section>
                    )}
                    {info.other_facts?.shariah_compliance && (
                      <section>
                        <SectionLabel>Shariah Compliance</SectionLabel>
                        <div className="border border-white/10 rounded-xl p-6">
                          <p className="text-white/70 text-sm leading-relaxed">
                            {info.other_facts.shariah_compliance}
                          </p>
                        </div>
                      </section>
                    )}
                    {info.contact && (
                      <section>
                        <SectionLabel>Contact</SectionLabel>
                        <div className="border border-white/10 rounded-xl p-6">
                          {info.contact.phone && (
                            <FactRow label="Phone" value={info.contact.phone} />
                          )}
                          {info.contact.toll_free && (
                            <FactRow
                              label="Toll Free"
                              value={info.contact.toll_free}
                            />
                          )}
                          {info.contact.email && (
                            <FactRow label="Email" value={info.contact.email} />
                          )}
                          {info.contact.website && (
                            <FactRow
                              label="Website"
                              value={info.contact.website}
                            />
                          )}
                          {info.contact.ussd && (
                            <FactRow label="USSD" value={info.contact.ussd} />
                          )}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <div className="border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-white/30 text-sm">
                      No detailed information available for this fund.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* FAQS TAB */}
            {tab === "faqs" && (
              <section>
                <SectionLabel>Frequently Asked Questions</SectionLabel>
                {info?.faqs?.length > 0 ? (
                  <div className="space-y-3">
                    {info.faqs.map((item, i) => (
                      <FAQRow key={`${item.question}-${i}`} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-white/30 text-sm">
                      No FAQs available for this fund yet.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ---- RIGHT SIDEBAR ---- */}
          <div className="space-y-6">
            {/* Invest Card */}
            <div className="border border-white/10 rounded-xl p-6">
              <h3 className="text-base font-semibold mb-5">Invest in {name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wide block mb-2">
                    Amount ({ccy})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={investAmt}
                    onChange={(e) => setInvestAmt(e.target.value)}
                    placeholder="Enter amount"
                    className={cn(
                      "w-full bg-white/5 border rounded-lg py-3 px-4 text-white placeholder-white/30 focus:outline-none transition-colors text-sm",
                      belowMin
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/10 focus:border-white/30",
                    )}
                  />
                  {belowMin && (
                    <p className="text-xs text-red-400 mt-1.5">
                      Minimum investment is {ccy} {fmt(minInvestNum)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => setInvestAmt(a.toLocaleString())}
                      className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    >
                      {fmt(a, { compact: true })}
                    </button>
                  ))}
                </div>
                <button
                  disabled={belowMin || !numericAmt}
                  className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
                {minInvestNum != null && (
                  <p className="text-xs text-white/30 text-center">
                    Min. investment: {ccy} {fmt(minInvestNum)}
                  </p>
                )}
                {info?.other_facts?.lock_in_days && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
                    <Lock size={12} className="text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-400">
                      {info.other_facts.lock_in_days}-day lock-in from
                      investment date
                    </p>
                  </div>
                )}
                {info?.other_facts?.collateral_eligible && (
                  <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
                    <Info size={12} className="text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-400">
                      Units can be used as collateral for loans
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Facts */}
            <div className="border border-white/10 rounded-xl p-6">
              <h3 className="text-base font-semibold mb-4">Key Facts</h3>
              <FactRow label="Manager" value={manager_name || info?.manager} />
              <FactRow label="Type" value={fund_type || info?.fund_type} />
              <FactRow label="Currency" value={ccy} />
              <FactRow label="Risk" value={info?.risk_level} />
              <FactRow
                label="Entry Fee"
                value={formatFee(info?.entry_load || entry_load)}
                accent={
                  isFee(info?.entry_load || entry_load)
                    ? "text-red-400"
                    : "text-emerald-400"
                }
              />
              <FactRow
                label="Exit Fee"
                value={formatFee(info?.exit_load || exit_load)}
                accent={
                  isFee(info?.exit_load || exit_load)
                    ? "text-red-400"
                    : "text-emerald-400"
                }
              />
              <FactRow label="Mgmt Fee" value={info?.management_fee} />
              <FactRow
                label="Settlement"
                value={
                  (info?.redemption_days ?? redemption_days) != null
                    ? `T+${info?.redemption_days ?? redemption_days}`
                    : null
                }
              />
              <FactRow label="Inception" value={info?.inception_date} />
              <FactRow label="Benchmark" value={info?.benchmark || benchmark} />
            </div>

            {/* Contact Card */}
            {info?.contact && (
              <div className="border border-white/10 rounded-xl p-6">
                <h3 className="text-base font-semibold mb-4">
                  Contact Manager
                </h3>
                <div className="space-y-3">
                  {info.contact.phone && (
                    <a
                      href={`tel:${info.contact.phone}`}
                      className="flex items-center justify-between text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <span className="text-white/40">Phone</span>
                      <span>{info.contact.phone}</span>
                    </a>
                  )}
                  {info.contact.toll_free && (
                    <a
                      href={`tel:${info.contact.toll_free.split("/")[0].trim()}`}
                      className="flex items-center justify-between text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <span className="text-white/40">Toll Free</span>
                      <span className="text-right text-xs">
                        {info.contact.toll_free}
                      </span>
                    </a>
                  )}
                  {info.contact.email && (
                    <a
                      href={`mailto:${info.contact.email}`}
                      className="flex items-center justify-between text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <span className="text-white/40">Email</span>
                      <span className="truncate ml-2">
                        {info.contact.email}
                      </span>
                    </a>
                  )}
                  {info.contact.website && (
                    <a
                      href={
                        info.contact.website.startsWith("http")
                          ? info.contact.website
                          : `https://${info.contact.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <span className="text-white/40">Website</span>
                      <span className="flex items-center gap-1">
                        {info.contact.website} <ExternalLink size={11} />
                      </span>
                    </a>
                  )}
                  {info.contact.ussd && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/40">USSD</span>
                      <span className="text-white font-mono">
                        {info.contact.ussd}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="border border-white/10 rounded-xl p-6">
              <h3 className="text-base font-semibold mb-4">Documents</h3>
              {[
                "Offer Document / Prospectus",
                "Key Facts Statement",
                "Monthly Factsheet",
                "Annual Report",
              ].map((doc) => (
                <button
                  key={doc}
                  className="w-full flex items-center justify-between py-3 border-b border-white/5 last:border-0 group"
                >
                  <span className="text-white/60 group-hover:text-white transition-colors text-sm">
                    {doc}
                  </span>
                  <Download
                    size={14}
                    className="text-white/30 group-hover:text-white transition-colors"
                  />
                </button>
              ))}
            </div>

            {/* Risk Notice */}
            <div className="border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 leading-relaxed">
                <span className="text-white/60 font-medium">
                  Risk Warning:{" "}
                </span>
                Investment involves risk including potential loss of principal.
                Past performance does not guarantee future results. Please read
                all fund documents before investing.
                {info?.other_facts?.regulator && (
                  <> Regulated by {info.other_facts.regulator}.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-white/10 sm:hidden z-50"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button className="w-full py-4 bg-white text-black font-semibold rounded-lg text-sm">
            Invest in {name}
          </button>
        </div>
        <div className="h-24 sm:hidden" />
      </div>
    </div>
  );
};

export default FundPage;
