"use client";

import React, { useState } from "react";
import { withAuth } from "@/features/utils/with-auth";
import { DashboardProvider, useDashboard } from "@/features/context/dashboard-context";
import { AIWidget } from "./AIWidget";
import { AllocationWidget } from "./AllocationWidget";
import { Breadcrumbs } from "./Breadcrumbs";
import { CalendarWidget } from "./CalendarWidget";
import { MarketAiWidget } from "./MarketAiWidget";
import { MarketHeatmapWidget } from "./MarketHeatmapWidget";
import { MarketPerformanceWidget } from "./MarketPerformanceWidget";
import { MarketSummaryWidget } from "./MarketSummaryWidget";
import { MarketTopAssetsWidget } from "./MarketTopAssetsWidget";
import { MarketWatchlistWidget } from "./MarketWatchlistWidget";
import { PerformanceWidget } from "./PerformanceWidget";
import { PortfolioSelector } from "./PortfolioSelector";
import { PortfolioWidget } from "./PortfolioWidget";
import { PositionsWidget } from "./PositionsWidget";
import { TransactionsWidget } from "./TransactionsWidget";
import InstallPWA from "@/components/InstallPWA";
import { Newspaper, PieChart, TrendingDown, TrendingUp } from "lucide-react";

const VIEWS = [
  { id: "portfolio", label: "Portfolio", icon: PieChart },
  { id: "market", label: "Market Highlights", icon: Newspaper },
];

const PortfolioDashboardView = () => (
  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
    <div className="flex flex-col gap-5 lg:col-span-2">
      <PortfolioWidget />
      <PositionsWidget />
      <TransactionsWidget />
    </div>
    <div className="space-y-5 lg:col-span-1">
      <AllocationWidget />
      <CalendarWidget />
      <AIWidget />
      <PerformanceWidget />
    </div>
  </div>
);

const MarketHighlightsView = () => {
  const { selectedPortfolio, performanceData } = useDashboard();
  const isPositive = performanceData.changePercentage >= 0;
  const sentimentLabel =
    performanceData.changePercentage > 2
      ? "Upbeat Sentiment"
      : performanceData.changePercentage < -2
        ? "Risk-Off Tone"
        : "Balanced Outlook";

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-border/70 bg-card/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 border-b border-border/80 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Market Highlights
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                {selectedPortfolio ? `${selectedPortfolio.name} Market Desk` : "Market Desk"}
              </h2>
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {performanceData.changePercentage >= 0 ? "+" : ""}
                {performanceData.changePercentage.toFixed(2)}%
              </div>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              A Perplexity-inspired market layer for portfolio news flow, fund performance context, dividend timing, and event-driven highlights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-2 text-xs xl:self-auto">
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, index) => (
                  <span
                    key={index}
                    className="w-1 rounded-full bg-current"
                    style={{ height: `${8 + ((index % 4) + 1) * 3}px`, opacity: 0.35 + index * 0.05 }}
                  />
                ))}
              </div>
              <span className="font-semibold">{sentimentLabel}</span>
            </div>
            <div className="text-muted-foreground">
              {selectedPortfolio ? `${selectedPortfolio.name} Desk` : "Markets Open"}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.95fr)]">
          <div className="space-y-6">
            <MarketTopAssetsWidget />
            <MarketSummaryWidget />
            <MarketHeatmapWidget />
          </div>

          <div className="space-y-6">
            <MarketWatchlistWidget />
            <MarketPerformanceWidget />
            <CalendarWidget />
            <MarketAiWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardShell = () => {
  const [activeView, setActiveView] = useState("portfolio");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <InstallPWA />
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-5 sm:px-6 lg:px-10">
        <Breadcrumbs />

        <div className="rounded-[24px] border border-border/70 bg-card/70 p-4 backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 border-b border-border/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                Portfolio and market intelligence in one place
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Keep the original portfolio workspace for positions and transactions, then switch to Market Highlights for a broader news-and-events view.
              </p>
            </div>

            <div className="rounded-[18px] border border-border/70 bg-background/70 p-3">
              <PortfolioSelector />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {VIEWS.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {view.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {activeView === "portfolio" ? <PortfolioDashboardView /> : <MarketHighlightsView />}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPageInternal = () => <DashboardShell />;

const DashboardPage = () => (
  <DashboardProvider><DashboardPageInternal /></DashboardProvider>
);

export default withAuth(DashboardPage);
