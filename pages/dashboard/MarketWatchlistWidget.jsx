"use client";

import React, { useState } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Search, Star } from "lucide-react";
import { AddTransactionDialog } from "@/components/dashboard/AddTransactionDialog";

const WatchlistItem = ({ position, formatAmount }) => {
  const isPositive = parseFloat(position.profit_loss_percent || 0) >= 0;
  return (
    <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 transition-colors hover:bg-background/80 last:border-0">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-muted text-sm font-semibold text-foreground">
          {(position.asset_symbol || position.asset_name || "?").slice(0, 2)}
        </div>
        <div>
          <div className="text-[13px] font-bold text-foreground">{position.asset_name || position.asset_symbol}</div>
          <div className="text-[11px] font-medium text-tertiary">
            {position.asset_symbol} - {position.asset_type}
          </div>
        </div>
      </div>
      <div className="pr-8 text-right">
        <div className="font-mono text-[13px] font-semibold text-foreground">{formatAmount(position.current_value)}</div>
        <div className={cn("mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-semibold", isPositive ? "text-emerald-500" : "text-rose-500")}>
          {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {parseFloat(position.profit_loss_percent || 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export const MarketWatchlistWidget = () => {
  const { positions, isLoadingPositions, selectedPortfolio, selectedPortfolioId } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (isLoadingPositions) return <div className="h-[340px] w-full rounded-[22px] border border-border/70 bg-card/60 animate-pulse" />;
  if (!selectedPortfolio) return null;

  const filteredPositions = positions
    ? positions
        .filter((position) => {
          const query = search.toLowerCase();
          return (
            position.asset_symbol?.toLowerCase().includes(query) ||
            position.asset_name?.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => parseFloat(b.current_value || 0) - parseFloat(a.current_value || 0))
    : [];

  return (
    <>
      <div className="overflow-hidden rounded-[22px] border border-border/70 bg-background/60">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Create Watchlist</h2>
            <p className="text-sm text-muted-foreground">Monitor your core holdings like a live board.</p>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-accent"
          >
            Add Position
          </button>
        </div>

        <div className="border-b border-border/70 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary" />
            <input
              placeholder="Search holdings..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full rounded-[10px] border border-border/70 bg-card pl-9 pr-3 text-[13px] font-medium text-foreground placeholder:text-tertiary transition focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          {filteredPositions.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] font-medium text-tertiary">
              No watchlist items match your search.
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto">
              {filteredPositions.slice(0, 6).map((position, index) => (
                <div key={`${position.asset_id}-${index}`} className="relative">
                  <WatchlistItem position={position} formatAmount={formatAmount} />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground">
                    <Star size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPortfolioId && <AddTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} portfolioIdFromWidget={selectedPortfolioId} />}
    </>
  );
};

export default MarketWatchlistWidget;
