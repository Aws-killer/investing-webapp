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
  Bell,
  AlertCircle,
  Info,
} from "lucide-react";

import { FinancialChart } from "@/components/ui/FinancialChart";
import {
  useGetStocksQuery,
  useGetStockPricesQuery,
  useGetStockMetricsQuery,
  useGetStockDividendsQuery,
  useGetCorporateActionsQuery,
} from "@/features/api/stocksApi";
import { getStockLogoUrl } from "@/lib/stockLogos";

/* ================================ CONSTANTS ============================== */
const PERIODS = ["1M", "6M", "YTD", "1Y", "Max"];
const PERIOD_MAP = { "1M": "1m", "6M": "6m", YTD: "ytd", "1Y": "1y", Max: "max" };
const MAX_LIMIT = 500;
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

const annualize = (totalReturnPct, years) => {
  if (totalReturnPct == null || !years || years <= 0) return null;
  const factor = 1 + totalReturnPct / 100;
  if (factor <= 0) return null;
  return (Math.pow(factor, 1 / years) - 1) * 100;
};

const StockIdentityLogo = ({ symbol, logoUrl }) => {
  const [failed, setFailed] = useState(false);
  const displayLogoUrl = getStockLogoUrl(symbol, logoUrl);

  if (!displayLogoUrl || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/50">
        {symbol?.slice(0, 4) || "STK"}
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2">
      <img
        src={displayLogoUrl}
        alt={`${symbol} logo`}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

/* ========================== SHARED COMPONENTS ============================ */
const Spinner = ({ large = false }) => (
  <div className={large ? "relative w-12 h-12" : "relative w-8 h-8"}>
    <div className={cn("border-2 border-white/10 rounded-full", large ? "w-12 h-12" : "w-8 h-8")} />
    <div className={cn("absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin", large ? "w-12 h-12" : "w-8 h-8")} />
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center space-y-4">
      <Spinner large />
      <p className="text-white/50 text-sm">Loading stock data…</p>
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

const FactRow = ({ label, value, accent }) => (
  <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
    <span className="text-white/40 text-sm shrink-0">{label}</span>
    <span className={cn("text-sm font-medium text-right break-words", accent || "text-white")}>
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
          display == null ? "text-white/30" : pos ? "text-emerald-400" : "text-red-400",
        )}
      >
        {display ?? "—"}
      </span>
    </div>
  );
};

const CorporateActionRow = ({ action }) => (
  <div className="flex items-start justify-between gap-4 p-4 border-b border-white/5 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-white">
        {action.headline || `${action.symbol} corporate action`}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/40">
        {action.action_type || "Corporate Action"}
      </p>
      <div className="mt-2 space-y-1 text-xs text-white/50">
        {action.announcement_date && <p>Announced: {fmtDate(action.announcement_date)}</p>}
        {action.books_closure_date && <p>Books closure: {fmtDate(action.books_closure_date)}</p>}
        {action.payment_date && <p>Payment: {fmtDate(action.payment_date)}</p>}
      </div>
    </div>
    <div className="shrink-0 text-right">
      {action.dividend_amount != null && (
        <p className="text-sm font-semibold text-white">
          TZS {fmt(action.dividend_amount, { decimals: 4 })}
        </p>
      )}
      {action.document_url && (
        <a
          href={action.document_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-xs font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          View document
        </a>
      )}
    </div>
  </div>
);

/* ========================== PROFIT OVERLAY ================================ */
const ProfitOverlay = ({ startPoint, endPoint, containerRef, chartData }) => {
  if (!startPoint || !endPoint || !chartData.length || !containerRef.current) return null;
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
    const days = Math.ceil((new Date(later.date) - new Date(earlier.date)) / DAY_MS);
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
        <div className={cn("absolute left-0 top-0 bottom-0 w-px", pos ? "bg-emerald-500/30" : "bg-red-500/30")} />
        <div className={cn("absolute right-0 top-0 bottom-0 w-px", pos ? "bg-emerald-500/30" : "bg-red-500/30")} />
      </div>
      <div
        className="absolute z-20 pointer-events-none"
        style={{ left: left + width / 2, top: 24, transform: "translateX(-50%)" }}
      >
        <div className="bg-white text-black rounded-lg shadow-2xl overflow-hidden min-w-[160px]">
          <div className="p-4 text-center">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">
              {pos ? "Gain" : "Loss"}
            </p>
            <p className={cn("text-2xl font-bold", pos ? "text-emerald-600" : "text-red-600")}>
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

/* ========================== DRAGGABLE CHART ============================== */
const DraggableChart = ({
  chartData,
  chartLoading,
  height = "h-[300px] sm:h-[400px]",
}) => {
  const ref = useRef(null);
  const timeoutRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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
    (e) => { if (isDragging) setDragEnd(getPoint(e)); },
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
            currentValue={chartData.at(-1)?.value}
            isLoading={chartLoading}
            formatter={(v) => `TZS ${fmt(v)}`}
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
const StockPage = () => {
  const router = useRouter();
  const rawSymbol = router.query.symbol;

  const symbol = useMemo(() => {
    if (!rawSymbol) return null;
    const s = Array.isArray(rawSymbol) ? rawSymbol[0] : rawSymbol;
    return s.toUpperCase();
  }, [rawSymbol]);

  const [timeRange, setTimeRange] = useState("1Y");
  const [tab, setTab] = useState("overview");
  const [starred, setStarred] = useState(false);

  const backendPeriod = PERIOD_MAP[timeRange] || "max";

  /* ── API ── */
  const { data: stocks, isLoading: stocksLoading } = useGetStocksQuery();

  const {
    data: pricesData,
    isLoading: pricesLoading,
    isFetching: pricesFetching,
  } = useGetStockPricesQuery(
    { symbol, time_range: backendPeriod, limit: MAX_LIMIT },
    { skip: !symbol },
  );

  const { data: fullPricesData } = useGetStockPricesQuery(
    { symbol, time_range: "max", limit: MAX_LIMIT },
    { skip: !symbol },
  );

  const { data: metrics } = useGetStockMetricsQuery(symbol, { skip: !symbol });
  const { data: dividends = [] } = useGetStockDividendsQuery(symbol, { skip: !symbol });
  const { data: corporateActions = [] } = useGetCorporateActionsQuery(
    { symbol, limit: 20 },
    { skip: !symbol },
  );

  /* ── Derive stock from list ── */
  const stock = useMemo(
    () => stocks?.find((s) => s.symbol === symbol),
    [stocks, symbol],
  );

  const {
    latest_price,
    opening_price,
    high,
    low,
    volume,
    market_cap,
    name = symbol,
    logo_url,
  } = stock || {};

  /* ── Chart data ascending for selected period ── */
  const chartData = useMemo(() => {
    if (!pricesData?.prices) return [];
    return [...pricesData.prices]
      .filter((p) => p.closing_price != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((p) => ({ date: p.date, value: Number(p.closing_price) }));
  }, [pricesData]);

  /* ── Full chart data for performance metrics ── */
  const fullChartData = useMemo(() => {
    if (!fullPricesData?.prices) return [];
    return [...fullPricesData.prices]
      .filter((p) => p.closing_price != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((p) => ({ date: p.date, value: Number(p.closing_price) }));
  }, [fullPricesData]);

  /* ── Performance metrics ── */
  const perf = useMemo(() => {
    if (!fullChartData.length) return {};
    const sorted = fullChartData;
    const latest = sorted.at(-1).value;
    const latestD = new Date(sorted.at(-1).date);

    const priceBefore = (d) => {
      const filtered = sorted.filter((p) => new Date(p.date) <= d);
      return filtered.length ? filtered.at(-1).value : null;
    };
    const pct = (old) => (old && old !== 0 ? ((latest - old) / old) * 100 : null);
    const ago = (days) => new Date(latestD - days * DAY_MS);

    const ytdRet = pct(priceBefore(new Date(latestD.getFullYear(), 0, 1)));
    const oneYRet = pct(priceBefore(ago(365)));
    const threeYRet = pct(priceBefore(ago(365 * 3)));
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

  /* ── Day change vs opening ── */
  const { priceChange, priceChangePct, up } = useMemo(() => {
    if (latest_price == null || opening_price == null)
      return { priceChange: null, priceChangePct: null, up: true };
    const change = latest_price - opening_price;
    return {
      priceChange: change,
      priceChangePct: opening_price ? (change / opening_price) * 100 : null,
      up: change >= 0,
    };
  }, [latest_price, opening_price]);

  /* ── Render guards ── */
  if (stocksLoading || pricesLoading) return <LoadingState />;

  if (!stock && !stocksLoading && symbol)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-white/50" />
          </div>
          <h2 className="text-xl font-semibold text-white">Stock not found</h2>
          <p className="text-white/50 text-sm">
            {symbol} could not be found on the DSE.
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
            onClick={() => router.push("/stocks")}
            className="hover:text-white/60 transition-colors"
          >
            Stocks
          </button>
          <ChevronRight size={14} />
          <span className="text-white/50">{symbol}</span>
        </nav>

        {/* ===== HEADER ===== */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
            <div className="flex min-w-0 items-start gap-4">
              <StockIdentityLogo symbol={symbol} logoUrl={logo_url} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                    {symbol}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/40">
                    Dar es Salaam Stock Exchange
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                  {name}
                </h1>
                <p className="text-white/40 text-sm">DSE Listed Equity</p>
              </div>
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
                aria-label="Star stock"
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

          {/* Price block */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                Latest Price
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  {fmt(latest_price)}
                </span>
                <span className="text-lg text-white/40">TZS</span>
              </div>
              {priceChange != null && (
                <div
                  className={cn(
                    "flex items-center gap-2 mt-2 text-base font-medium",
                    up ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {up ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  <span>{fmt(Math.abs(priceChange))}</span>
                  {priceChangePct != null && <span>({fmtPct(priceChangePct)})</span>}
                  <span className="text-xs text-white/40">vs. opening</span>
                </div>
              )}
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide mb-1">
                  Market Cap
                </p>
                <p className="text-xl font-semibold">
                  {market_cap ? `TZS ${fmt(market_cap, { compact: true })}` : "—"}
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
            { label: "Open", value: opening_price ? `TZS ${fmt(opening_price)}` : "—" },
            { label: "Day High", value: high ? `TZS ${fmt(high)}` : "—" },
            { label: "Day Low", value: low ? `TZS ${fmt(low)}` : "—" },
            { label: "Volume", value: volume ? fmt(volume, { compact: true }) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 sm:p-6">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
                {label}
              </p>
              <p className="text-xl sm:text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* ===== TABS ===== */}
        <div className="flex items-center border-b border-white/10 mb-10 overflow-x-auto">
          {["overview", "performance", "details"].map((t) => (
            <TabButton
              key={t}
              label={t.charAt(0).toUpperCase() + t.slice(1)}
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
                  <DraggableChart chartData={chartData} chartLoading={pricesFetching} />
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
                        <div key={label} className="border border-white/10 rounded-xl p-4">
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

                {dividends.length > 0 && (
                  <section>
                    <SectionLabel>Recent Dividends</SectionLabel>
                    <div className="border border-white/10 rounded-xl divide-y divide-white/5">
                      {dividends.slice(0, 5).map((div, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium">
                              TZS {fmt(div.amount_per_share)}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              Ex-div: {fmtDate(div.ex_dividend_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-white/40">Payment</p>
                            <p className="text-sm text-white/70">
                              {fmtDate(div.payment_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {corporateActions.length > 0 && (
                  <section>
                    <SectionLabel>Corporate Actions</SectionLabel>
                    <div className="border border-white/10 rounded-xl divide-y divide-white/5">
                      {corporateActions.slice(0, 5).map((action) => (
                        <CorporateActionRow
                          key={`${action.symbol}-${action.announcement_date || action.payment_date || action.document_url || action.headline}`}
                          action={action}
                        />
                      ))}
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
                    chartLoading={pricesFetching}
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
                    <PerfRow label="3 Years (Total)" value={perf.three_y_total} />
                    <PerfRow label="3 Years (Annualized)" value={perf.three_y_ann} />
                    <PerfRow label="Since Inception (Total)" value={perf.inception} />
                  </div>
                  {perf.first_date && (
                    <p className="text-xs text-white/30 mt-3 text-center">
                      Data from {fmtDate(perf.first_date)} to {fmtDate(perf.last_date)} ·{" "}
                      {perf.total_points} data points
                    </p>
                  )}
                  <div className="mt-4 p-4 bg-white/5 rounded-lg flex gap-3">
                    <Info size={14} className="text-white/30 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/40 leading-relaxed">
                      Returns are computed from daily closing prices. Annualized figures use
                      compound annual growth rate (CAGR). Past performance does not guarantee
                      future results.
                    </p>
                  </div>
                </section>
              </>
            )}

            {/* DETAILS TAB */}
            {tab === "details" && (
              <>
                <section>
                  <SectionLabel>Price Data</SectionLabel>
                  <div className="border border-white/10 rounded-xl p-6">
                    <FactRow
                      label="Closing Price"
                      value={latest_price ? `TZS ${fmt(latest_price)}` : null}
                    />
                    <FactRow
                      label="Opening Price"
                      value={opening_price ? `TZS ${fmt(opening_price)}` : null}
                    />
                    <FactRow
                      label="Day High"
                      value={high ? `TZS ${fmt(high)}` : null}
                    />
                    <FactRow
                      label="Day Low"
                      value={low ? `TZS ${fmt(low)}` : null}
                    />
                    <FactRow
                      label="Volume"
                      value={volume ? fmt(volume, { compact: true }) : null}
                    />
                    <FactRow
                      label="Market Cap"
                      value={market_cap ? `TZS ${fmt(market_cap, { compact: true })}` : null}
                    />
                  </div>
                </section>

                {metrics && Object.keys(metrics).length > 0 && (
                  <section>
                    <SectionLabel>Market Metrics</SectionLabel>
                    <div className="border border-white/10 rounded-xl p-6">
                      {metrics.pe_ratio != null && (
                        <FactRow label="P/E Ratio" value={fmt(metrics.pe_ratio)} />
                      )}
                      {metrics.eps != null && (
                        <FactRow label="EPS" value={`TZS ${fmt(metrics.eps)}`} />
                      )}
                      {metrics.dividend_yield != null && (
                        <FactRow label="Dividend Yield" value={fmtPct(metrics.dividend_yield)} />
                      )}
                      {metrics.week_52_high != null && (
                        <FactRow label="52W High" value={`TZS ${fmt(metrics.week_52_high)}`} />
                      )}
                      {metrics.week_52_low != null && (
                        <FactRow label="52W Low" value={`TZS ${fmt(metrics.week_52_low)}`} />
                      )}
                      {metrics.avg_volume != null && (
                        <FactRow
                          label="Avg. Volume"
                          value={fmt(metrics.avg_volume, { compact: true })}
                        />
                      )}
                      {metrics.beta != null && (
                        <FactRow label="Beta" value={fmt(metrics.beta, { decimals: 3 })} />
                      )}
                    </div>
                  </section>
                )}

                {dividends.length > 0 && (
                  <section>
                    <SectionLabel>Dividend History</SectionLabel>
                    <div className="border border-white/10 rounded-xl divide-y divide-white/5">
                      {dividends.map((div, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium">
                              TZS {fmt(div.amount_per_share)}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              Ex-div: {fmtDate(div.ex_dividend_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-white/40">Payment</p>
                            <p className="text-sm text-white/70">
                              {fmtDate(div.payment_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {corporateActions.length > 0 && (
                  <section>
                    <SectionLabel>Corporate Actions</SectionLabel>
                    <div className="border border-white/10 rounded-xl divide-y divide-white/5">
                      {corporateActions.map((action) => (
                        <CorporateActionRow
                          key={`${action.symbol}-${action.announcement_date || action.payment_date || action.document_url || action.headline}`}
                          action={action}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* ---- RIGHT SIDEBAR ---- */}
          <div className="space-y-6">
            {/* Key Facts */}
            <div className="border border-white/10 rounded-xl p-6">
              <h3 className="text-base font-semibold mb-4">Key Facts</h3>
              <FactRow label="Symbol" value={symbol} />
              <FactRow label="Exchange" value="Dar es Salaam SE" />
              <FactRow label="Currency" value="TZS" />
              <FactRow
                label="Latest Price"
                value={latest_price ? `TZS ${fmt(latest_price)}` : null}
              />
              <FactRow
                label="Market Cap"
                value={market_cap ? `TZS ${fmt(market_cap, { compact: true })}` : null}
              />
              <FactRow
                label="Volume"
                value={volume ? fmt(volume, { compact: true }) : null}
              />
              {metrics?.pe_ratio != null && (
                <FactRow label="P/E Ratio" value={fmt(metrics.pe_ratio)} />
              )}
              {metrics?.dividend_yield != null && (
                <FactRow label="Div. Yield" value={fmtPct(metrics.dividend_yield)} />
              )}
            </div>

            {/* Performance */}
            <div className="border border-white/10 rounded-xl p-6">
              <h3 className="text-base font-semibold mb-4">Performance</h3>
              <FactRow
                label="YTD"
                value={fmtPct(perf.ytd) ?? "—"}
                accent={
                  perf.ytd != null
                    ? perf.ytd >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                    : undefined
                }
              />
              <FactRow
                label="1 Year"
                value={fmtPct(perf.one_y) ?? "—"}
                accent={
                  perf.one_y != null
                    ? perf.one_y >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                    : undefined
                }
              />
              <FactRow
                label="3 Years"
                value={fmtPct(perf.three_y_total) ?? "—"}
                accent={
                  perf.three_y_total != null
                    ? perf.three_y_total >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                    : undefined
                }
              />
              <FactRow
                label="Since Inception"
                value={fmtPct(perf.inception) ?? "—"}
                accent={
                  perf.inception != null
                    ? perf.inception >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                    : undefined
                }
              />
            </div>

            {/* Risk Notice */}
            <div className="border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 leading-relaxed">
                <span className="text-white/60 font-medium">Risk Warning: </span>
                Investing in equities involves risk including potential loss of principal.
                Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>

        <div className="h-6 sm:hidden" />
      </div>
    </div>
  );
};

export default StockPage;
