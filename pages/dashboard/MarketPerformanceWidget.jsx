"use client";

import React from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";

const formatDate = (value) => {
  if (!value) return "Unavailable";
  return new Date(value).toLocaleDateString();
};

export const MarketPerformanceWidget = () => {
  const { marketHighlights, isLoadingMarketHighlights } = useDashboard();
  const { formatAmount } = useCurrency();

  if (isLoadingMarketHighlights) {
    return <div className="h-[260px] w-full animate-pulse rounded-[22px] border border-border/70 bg-card/60" />;
  }

  const overview = marketHighlights?.overview || {};
  const stats = [
    { label: "Tracked Securities", value: `${overview.tracked_securities || 0}` },
    { label: "Advancers", value: `${overview.advancers || 0}` },
    { label: "Decliners", value: `${overview.decliners || 0}` },
    { label: "Unchanged", value: `${overview.unchanged || 0}` },
    { label: "Total Volume", value: Number(overview.total_volume || 0).toLocaleString() },
    { label: "Total Turnover", value: formatAmount(overview.total_turnover || 0) },
  ];

  return (
    <div className="rounded-[22px] border border-border/70 bg-background/60 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Market Board</h2>
        <p className="text-sm text-muted-foreground">Live DSE breadth and trading activity from the backend sync.</p>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-[16px] border border-border/70 bg-card/70 px-4 py-3"
          >
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className="text-sm font-semibold text-foreground">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[18px] border border-border/70 bg-card/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Backend Status</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Trading date {formatDate(marketHighlights?.trading_date)}. Last backend refresh{" "}
          {formatDate(marketHighlights?.updated_at)}. Top gainer {overview.top_gainer_symbol || "n/a"}, top loser{" "}
          {overview.top_loser_symbol || "n/a"}, most active {overview.most_active_symbol || "n/a"}.
        </p>
      </div>
    </div>
  );
};

export default MarketPerformanceWidget;
