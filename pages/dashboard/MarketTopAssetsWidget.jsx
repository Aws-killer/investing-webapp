"use client";

import React, { useMemo, useState } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useDeletePortfolioMutation } from "@/features/api/portfoliosApi";
import { useCurrency } from "@/features/context/currency-context";
import { CreatePortfolioDialog } from "./Dialogs/CreatePortfolioDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, ChevronDown, Trash, RefreshCw, Loader2, Clock3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCompactValue = (value) => {
  const amount = Math.abs(Number(value) || 0);
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toFixed(2);
};

const buildSparkline = (changePercent = 0, index = 0) => {
  const drift = Math.max(Math.min(changePercent, 12), -12);
  const base = [46, 44, 45, 42, 39, 37, 34, 31, 29];
  const volatility = [0, 4, -2, 3, -3, 2, -1, 2, 0];
  const values = base.map((point, pointIndex) => {
    const direction = drift >= 0 ? -1 : 1;
    const adjusted = point + volatility[pointIndex] + (drift * direction * pointIndex) / 10 + index * 0.4;
    return Math.max(10, Math.min(50, adjusted));
  });

  return values
    .map((value, pointIndex) => `${pointIndex === 0 ? "M" : "L"} ${pointIndex * 18},${value}`)
    .join(" ");
};

export const MarketTopAssetsWidget = () => {
  const { selectedPortfolio, isLoadingPortfolios, performanceData, positions, setSelectedPortfolioId, refetchPerformance } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePortfolio, { isLoading: isDeleting }] = useDeletePortfolioMutation();

  const handleDelete = async () => {
    if (!selectedPortfolio?.id) return;
    await deletePortfolio(selectedPortfolio.id);
    setIsDeleteOpen(false);
  };

  const { currentValue, changeValue, changePercentage, isRecalculating, recalculation, pendingMessage } = performanceData;
  const recalcLabel = recalculation?.status === "running" ? "Recalculating" : "Queued";

  const topAssets = useMemo(() => {
    if (positions?.length) {
      return [...positions]
        .sort((a, b) => parseFloat(b.current_value || 0) - parseFloat(a.current_value || 0))
        .slice(0, 4)
        .map((position, index) => ({
          id: `${position.asset_type}-${position.asset_id}-${index}`,
          title: position.asset_symbol || position.asset_name || `Asset ${index + 1}`,
          subtitle: position.asset_name || position.asset_type,
          value: parseFloat(position.current_value || 0),
          changeValue: parseFloat(position.profit_loss || 0),
          changePercent: parseFloat(position.profit_loss_percent || 0),
          sparkIndex: index,
        }));
    }

    if (!selectedPortfolio) return [];

    return [
      {
        id: "portfolio-total",
        title: selectedPortfolio.name || "Portfolio",
        subtitle: "Net worth",
        value: currentValue,
        changeValue,
        changePercent: changePercentage,
        sparkIndex: 0,
      },
    ];
  }, [positions, selectedPortfolio, currentValue, changeValue, changePercentage]);

  return (
    <>
      <div className="rounded-[22px] border border-border/70 bg-background/60 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Top Assets</h2>
            <p className="text-sm text-muted-foreground">
              {selectedPortfolio
                ? `Largest exposures inside ${selectedPortfolio.name}.`
                : "Build a portfolio to surface your leading positions."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!selectedPortfolio ? (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-accent"
              >
                <Plus size={13} /> Create Portfolio
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground">
                    Options <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border shadow-lg rounded-[12px]">
                  <DropdownMenuItem
                    className="text-[13px] font-medium text-foreground focus:bg-muted cursor-pointer"
                    onSelect={() => refetchPerformance()}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Refresh Data
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[13px] font-medium text-destructive focus:bg-destructive/10 cursor-pointer" onSelect={() => setIsDeleteOpen(true)}>
                    <Trash className="mr-2 h-3.5 w-3.5" /> Delete Portfolio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {selectedPortfolio && isRecalculating && (
          <div className="mb-4 rounded-[16px] border border-amber-500/20 bg-amber-500/8 px-4 py-3">
            <div className="flex items-start gap-2">
              {recalculation?.status === "running" ? (
                <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-amber-500" />
              ) : (
                <Clock3 size={14} className="mt-0.5 shrink-0 text-amber-500" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-600">
                  {recalcLabel}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {pendingMessage || "Portfolio performance is being refreshed."}
                  {recalculation?.stale_from_date ? ` From ${recalculation.stale_from_date}.` : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoadingPortfolios ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[190px] animate-pulse rounded-[20px] border border-border/70 bg-card/60" />
            ))}
          </div>
        ) : topAssets.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No holdings yet. Add a transaction and your top assets will show up here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {topAssets.map((asset) => {
              const isPositive = asset.changePercent >= 0;
              return (
                <div
                  key={asset.id}
                  className="group rounded-[20px] border border-border/70 bg-card/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">{asset.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{asset.subtitle}</p>
                    </div>
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                        isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      )}
                    >
                      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {asset.changePercent >= 0 ? "+" : ""}
                      {asset.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                        {formatCompactValue(asset.value)}
                      </p>
                      <p className={cn("mt-1 text-sm font-medium", isPositive ? "text-emerald-400" : "text-rose-400")}>
                        {asset.changeValue >= 0 ? "+" : "-"}
                        {formatAmount(Math.abs(asset.changeValue))}
                      </p>
                    </div>
                    <div className="text-right text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Live
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[16px] border border-border/60 bg-background/70 px-3 py-3">
                    <svg viewBox="0 0 144 56" className="h-14 w-full">
                      <defs>
                        <linearGradient id={`fill-${asset.id}`} x1="0" x2="0" y1="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={isPositive ? "#4ade80" : "#fb7185"}
                            stopOpacity="0.28"
                          />
                          <stop offset="100%" stopColor={isPositive ? "#4ade80" : "#fb7185"} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`${buildSparkline(asset.changePercent, asset.sparkIndex)} L 144,56 L 0,56 Z`}
                        fill={`url(#fill-${asset.id})`}
                      />
                      <path
                        d={buildSparkline(asset.changePercent, asset.sparkIndex)}
                        fill="none"
                        stroke={isPositive ? "#4ade80" : "#fb7185"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreatePortfolioDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onPortfolioCreated={(portfolio) => setSelectedPortfolioId(portfolio.id)} />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-popover border-border rounded-[12px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold tracking-[-0.03em] text-foreground">Delete Portfolio?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete <span className="font-bold text-foreground">{selectedPortfolio?.name}</span>. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-[6px] bg-muted border-none text-foreground hover:bg-accent text-[12px] font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-10 rounded-[6px] bg-destructive hover:opacity-80 border-none text-[12px] font-bold">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MarketTopAssetsWidget;
