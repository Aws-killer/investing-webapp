import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useGetStocksQuery } from "@/features/api/stocksApi";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import { getStockLogoUrl } from "@/lib/stockLogos";

const cn = (...c) => c.filter(Boolean).join(" ");

const fmt = (v, compact = false) => {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  if (compact)
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const SkeletonRow = () => (
  <div className="flex items-center justify-between px-4 py-3.5 bg-card">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
      <div className="space-y-1.5">
        <div className="h-3 w-14 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
      </div>
    </div>
    <div className="space-y-1.5 text-right">
      <div className="h-3 w-20 rounded bg-muted animate-pulse ml-auto" />
      <div className="h-2.5 w-12 rounded bg-muted animate-pulse ml-auto" />
    </div>
  </div>
);

const StockLogo = ({ stock }) => {
  const [failed, setFailed] = useState(false);
  const logoUrl = getStockLogoUrl(stock?.symbol, stock?.logo_url);

  if (!logoUrl || failed) {
    return (
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        <span className="text-[10px] font-bold text-muted-foreground">
          {stock.symbol.slice(0, 3)}
        </span>
      </div>
    );
  }

  return (
    <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
      <img
        src={logoUrl}
        alt={`${stock.symbol} logo`}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default function StocksPage() {
  const { data: stocks = [], isLoading, isFetching, refetch } = useGetStocksQuery();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return stocks;
    const q = query.toLowerCase();
    return stocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stocks, query]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
              DSE Market
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">Equities</h1>
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

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol or name…"
            className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-border rounded-md text-sm focus:outline-none focus:border-foreground/30 transition placeholder:text-muted-foreground"
          />
        </div>

        {/* Stats bar */}
        {!isLoading && stocks.length > 0 && (
          <p className="text-[11px] text-muted-foreground mb-4">
            {filtered.length} of {stocks.length} securities
          </p>
        )}

        {/* List */}
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {isLoading
            ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
            : filtered.map((stock) => {
                const change = (stock.latest_price ?? 0) - (stock.opening_price ?? 0);
                const changePct = stock.opening_price
                  ? (change / stock.opening_price) * 100
                  : 0;
                const isPos = change >= 0;

                return (
                  <Link
                    key={stock.symbol}
                    href={`/stocks/${stock.symbol}`}
                    className="flex items-center justify-between px-4 py-3.5 bg-card hover:bg-muted/50 transition active:scale-[.99]"
                  >
                    <div className="flex items-center gap-3">
                      <StockLogo stock={stock} />
                      <div>
                        <p className="text-[13px] font-semibold leading-tight">{stock.symbol}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[160px] sm:max-w-xs">
                          {stock.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold">
                        {stock.latest_price != null ? `TZS ${fmt(stock.latest_price)}` : "—"}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-0.5 justify-end text-[11px] font-medium",
                          isPos ? "text-emerald-500" : "text-red-400"
                        )}
                      >
                        {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {changePct >= 0 ? "+" : ""}
                        {changePct.toFixed(2)}%
                      </div>
                    </div>
                  </Link>
                );
              })}

          {!isLoading && filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              {query ? `No results for "${query}"` : "No stocks available yet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
