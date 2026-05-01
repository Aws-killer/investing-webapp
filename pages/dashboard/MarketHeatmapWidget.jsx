"use client";

import React from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";

export const MarketHeatmapWidget = () => {
  const { allocation, positions, totalPortfolioValue, isLoadingTransactions, selectedPortfolio } = useDashboard();
  const { formatAmount } = useCurrency();

  if (isLoadingTransactions) return <div className="h-[280px] w-full rounded-[22px] border border-border/70 bg-card/60 animate-pulse" />;
  if (!selectedPortfolio || !allocation?.length) return null;

  const heatmapItems = [...allocation]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((item) => {
      const matchingPosition = positions.find(
        (position) => item.name === (position.asset_name || position.asset_symbol || `${position.asset_type} ID ${position.asset_id}`)
      );
      const performance = parseFloat(matchingPosition?.profit_loss_percent || 0);
      return {
        ...item,
        performance,
        spanClass:
          item.value > 25
            ? "md:col-span-2 md:row-span-2"
            : item.value > 14
              ? "md:col-span-2"
              : "",
      };
    });

  return (
    <div className="rounded-[22px] border border-border/70 bg-background/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Portfolio Heatmap</h2>
          <p className="text-sm text-muted-foreground">Weighted by allocation and tinted by unrealized momentum.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total Value</p>
          <p className="text-base font-semibold text-foreground">{formatAmount(totalPortfolioValue)}</p>
        </div>
      </div>

      <div className="grid auto-rows-[120px] gap-3 md:grid-cols-4">
        {heatmapItems.map((item, index) => {
          const isPositive = item.performance >= 0;
          return (
            <div
              key={`${item.name}-${index}`}
              className={`rounded-[18px] border border-white/8 p-4 ${item.spanClass}`}
              style={{
                background: isPositive
                  ? "linear-gradient(160deg, rgba(34,197,94,0.28), rgba(13,17,23,0.85))"
                  : "linear-gradient(160deg, rgba(244,63,94,0.22), rgba(13,17,23,0.88))",
              }}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-white">{item.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/60">Weight</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-white">{item.value.toFixed(1)}%</p>
                  <p className={`text-sm font-medium ${isPositive ? "text-emerald-200" : "text-rose-200"}`}>
                    {item.performance >= 0 ? "+" : ""}
                    {item.performance.toFixed(2)}% - {formatAmount(item.absoluteValue)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {allocation.slice(0, 5).map((item, index) => (
          <div key={`${item.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{item.name}</span>
            <span className="text-xs font-semibold text-foreground">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketHeatmapWidget;
