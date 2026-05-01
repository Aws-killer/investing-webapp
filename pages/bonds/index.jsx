import React, { useState, useMemo } from "react";
import { useGetBondsQuery } from "@/features/api/bondsApi";
import { Building2, RefreshCw, TrendingUp, TrendingDown, Search, ChevronUp, ChevronDown } from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");

// ── helpers ────────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

const fmtYear = (d) => {
  if (!d) return null;
  try { return new Date(d).getFullYear(); }
  catch { return null; }
};

const timeLeftLabel = (bond) => {
  if (bond.time_to_maturity_label) return bond.time_to_maturity_label;
  if (!bond.maturity_date) return "—";
  const days = Math.ceil((new Date(bond.maturity_date) - new Date()) / 86400000);
  if (days < 0) return "Matured";
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remDays = (days % 365) % 30;
  if (years > 0) return `${years}y ${months}m left`;
  if (months > 0) return `${months}m ${remDays}d left`;
  return `${remDays}d left`;
};

// Approximate yield-to-maturity using simplified formula
const calcYTM = (couponRate, pricePer100, dtm) => {
  if (!couponRate || !pricePer100 || !dtm || dtm <= 0) return null;
  const years = dtm / 365;
  const coupon = couponRate; // already in %
  const face = 100;
  const price = pricePer100;
  const ytm = (coupon + (face - price) / years) / ((face + price) / 2) * 100;
  return parseFloat(ytm.toFixed(3));
};

// Normalise maturity label: "2 Years" → "2Y", "10 Years" → "10Y" etc.
const normTenor = (s) => {
  if (!s) return "Other";
  const m = String(s).match(/(\d+)/);
  return m ? `${parseInt(m[1], 10)}Y` : String(s);
};

const TENOR_ORDER = ["2Y", "3Y", "5Y", "7Y", "10Y", "15Y", "20Y", "25Y", "30Y"];
const sortTenors = (a, b) => {
  const ai = TENOR_ORDER.indexOf(a);
  const bi = TENOR_ORDER.indexOf(b);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return a.localeCompare(b);
};

// ── sub-components ──────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="h-3 w-12 rounded bg-muted animate-pulse" />
    <div className="h-3 flex-1 rounded bg-muted animate-pulse" />
    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
    <div className="h-3 w-14 rounded bg-muted animate-pulse" />
  </div>
);

// Current yields summary cards by tenor (latest auction per tenor)
function YieldSummary({ bonds }) {
  const byTenor = useMemo(() => {
    const map = {};
    bonds.forEach((b) => {
      const tenor = normTenor(b.maturity_years);
      if (!map[tenor] || new Date(b.auction_date) > new Date(map[tenor].auction_date)) {
        map[tenor] = b;
      }
    });
    return map;
  }, [bonds]);

  const tenors = Object.keys(byTenor).sort(sortTenors);

  if (!tenors.length) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
        Current Yields — Latest Auction
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {tenors.map((tenor) => {
          const b = byTenor[tenor];
          const ytm = calcYTM(b.coupon_rate, b.price_per_100, b.dtm);
          return (
            <div key={tenor} className="bg-card border border-border rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{tenor} Bond</p>
              <p className="text-[22px] font-extrabold leading-tight mt-1">
                {ytm != null ? `${ytm.toFixed(2)}%` : `${b.coupon_rate?.toFixed(2)}%`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {ytm != null ? "YTM" : "Coupon"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Coupon {b.coupon_rate?.toFixed(3)}% · Price {b.price_per_100?.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{timeLeftLabel(b)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Year-over-year comparison table: rows = tenor, cols = years
function YoYComparison({ bonds }) {
  const data = useMemo(() => {
    // Group by tenor then year, keep latest auction per (tenor, year)
    const map = {};
    bonds.forEach((b) => {
      const tenor = normTenor(b.maturity_years);
      const year = fmtYear(b.auction_date);
      if (!year) return;
      if (!map[tenor]) map[tenor] = {};
      if (!map[tenor][year] || new Date(b.auction_date) > new Date(map[tenor][year].auction_date)) {
        map[tenor][year] = b;
      }
    });
    return map;
  }, [bonds]);

  const tenors = Object.keys(data).sort(sortTenors);
  const years = [...new Set(bonds.map((b) => fmtYear(b.auction_date)).filter(Boolean))].sort((a, b) => b - a).slice(0, 5);

  if (!tenors.length) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
        Coupon Rate — Year over Year
      </p>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Tenor</th>
                {years.map((yr) => (
                  <th key={yr} className="text-right px-4 py-2.5 font-semibold text-muted-foreground">{yr}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenors.map((tenor, ti) => (
                <tr key={tenor} className={cn("border-b border-border last:border-0", ti % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                  <td className="px-4 py-2.5 font-bold">{tenor}</td>
                  {years.map((yr, yi) => {
                    const b = data[tenor]?.[yr];
                    const prevYr = years[yi + 1];
                    const prevB = data[tenor]?.[prevYr];
                    const rate = b?.coupon_rate;
                    const prevRate = prevB?.coupon_rate;
                    const diff = rate != null && prevRate != null ? rate - prevRate : null;
                    return (
                      <td key={yr} className="px-4 py-2.5 text-right">
                        {rate != null ? (
                          <div>
                            <span className="font-semibold">{rate.toFixed(3)}%</span>
                            {diff != null && (
                              <span className={cn(
                                "ml-1 text-[10px]",
                                diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : "text-muted-foreground"
                              )}>
                                {diff > 0 ? "▲" : diff < 0 ? "▼" : ""}
                                {diff !== 0 ? ` ${Math.abs(diff).toFixed(3)}` : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Full sortable/searchable bond list
const COL_DEFS = [
  { key: "auction_date", label: "Auction Date", align: "left" },
  { key: "maturity_years", label: "Tenor", align: "left" },
  { key: "coupon_rate", label: "Coupon", align: "right" },
  { key: "price_per_100", label: "Price / 100", align: "right" },
  { key: "ytm", label: "YTM", align: "right" },
  { key: "dtm", label: "DTM", align: "right" },
  { key: "days_to_maturity", label: "Time Left", align: "right" },
  { key: "maturity_date", label: "Matures", align: "right" },
];

function BondTable({ bonds }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "auction_date", dir: "desc" });
  const [tenor, setTenor] = useState("All");

  const tenorOptions = useMemo(() => {
    const s = new Set(bonds.map((b) => normTenor(b.maturity_years)));
    return ["All", ...Array.from(s).sort(sortTenors)];
  }, [bonds]);

  const enriched = useMemo(() => bonds.map((b) => ({
    ...b,
    _tenor: normTenor(b.maturity_years),
    ytm: calcYTM(b.coupon_rate, b.price_per_100, b.dtm),
  })), [bonds]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return enriched.filter((b) => {
      if (tenor !== "All" && b._tenor !== tenor) return false;
      if (!q) return true;
      return (
        b.isin?.toLowerCase().includes(q) ||
        b._tenor.toLowerCase().includes(q) ||
        String(b.coupon_rate).includes(q) ||
        String(b.auction_number).includes(q)
      );
    });
  }, [enriched, query, tenor]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sort.key] ?? a["_tenor"];
      let bv = b[sort.key] ?? b["_tenor"];
      if (sort.key === "maturity_years") { av = a._tenor; bv = b._tenor; }
      if (typeof av === "string") return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sort.dir === "asc" ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0);
    });
  }, [filtered, sort]);

  const toggleSort = (key) => {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  };

  const SortIcon = ({ k }) => {
    if (sort.key !== k) return <ChevronUp size={11} className="opacity-20" />;
    return sort.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ISIN, coupon, auction…"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-card border border-border rounded-[8px] focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
        <select
          value={tenor}
          onChange={(e) => setTenor(e.target.value)}
          className="h-9 px-3 text-[12px] font-semibold bg-card border border-border rounded-[8px] focus:outline-none"
        >
          {tenorOptions.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {COL_DEFS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "px-3 py-2.5 font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition",
                      col.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    <div className={cn("inline-flex items-center gap-1", col.align === "right" && "flex-row-reverse")}>
                      {col.label} <SortIcon k={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={COL_DEFS.length} className="px-4 py-10 text-center text-muted-foreground text-[13px]">
                    No bonds match your filter.
                  </td>
                </tr>
              ) : sorted.map((b, i) => {
                const ytm = b.ytm;
                const yieldHigh = ytm != null && ytm > (b.coupon_rate ?? 0);
                return (
                  <tr key={b.id ?? i} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                    <td className="px-3 py-2.5 text-muted-foreground">{fmtDate(b.auction_date)}</td>
                    <td className="px-3 py-2.5 font-bold">{b._tenor}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{b.coupon_rate?.toFixed(3)}%</td>
                    <td className="px-3 py-2.5 text-right">{b.price_per_100?.toFixed(4)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-semibold",
                      ytm == null ? "text-muted-foreground" : yieldHigh ? "text-emerald-500" : "text-red-400"
                    )}>
                      {ytm != null ? `${ytm.toFixed(3)}%` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{b.dtm?.toLocaleString()}</td>
                    <td className={cn("px-3 py-2.5 text-right font-medium", b.is_matured ? "text-red-400" : "text-muted-foreground")}>
                      {timeLeftLabel(b)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{fmtDate(b.maturity_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{sorted.length} bond{sorted.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

const PAGE_TABS = [
  { id: "yields", label: "Yields" },
  { id: "yoy", label: "Year over Year" },
  { id: "all", label: "All Bonds" },
];

export default function BondsPage() {
  const { data: bonds = [], isLoading, isFetching, refetch } = useGetBondsQuery();
  const [activeTab, setActiveTab] = useState("yields");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Tanzania</p>
            <h1 className="text-2xl font-extrabold tracking-tight">Government Bonds</h1>
            <p className="text-[12px] text-muted-foreground mt-1">Treasury bonds from Bank of Tanzania auctions</p>
          </div>
          <button
            onClick={refetch}
            disabled={isFetching}
            className="h-9 w-9 flex items-center justify-center rounded-[6px] hover:bg-muted active:scale-95 transition disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={cn("text-muted-foreground", isFetching && "animate-spin")} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-[10px] mb-5">
          {PAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-bold rounded-[7px] transition",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : bonds.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Building2 size={40} className="text-muted-foreground/30" />
            <div>
              <p className="font-semibold">No bond data yet</p>
              <p className="text-sm text-muted-foreground mt-1">Bond data is scraped from bot.go.tz daily.</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "yields" && <YieldSummary bonds={bonds} />}
            {activeTab === "yoy" && <YoYComparison bonds={bonds} />}
            {activeTab === "all" && <BondTable bonds={bonds} />}
          </>
        )}
      </div>
    </div>
  );
}
