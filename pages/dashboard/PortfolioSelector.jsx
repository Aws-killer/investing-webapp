"use client";

import React from "react";
import { useDashboard } from "@/features/context/dashboard-context";

export const PortfolioSelector = () => {
  const { portfolios, selectedPortfolioId, setSelectedPortfolioId, isLoadingPortfolios } = useDashboard();

  if (isLoadingPortfolios) return <div className="h-11 w-72 animate-pulse rounded-[12px] bg-card/70" />;
  if (!portfolios || portfolios.length === 0) {
    return <p className="text-[13px] font-medium text-muted-foreground">No portfolios yet - create one to get started.</p>;
  }

  return (
    <div>
      <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Portfolio</label>
      <select
        value={selectedPortfolioId ? String(selectedPortfolioId) : ""}
        onChange={(event) => setSelectedPortfolioId(event.target.value ? Number(event.target.value) : null)}
        disabled={isLoadingPortfolios || portfolios.length === 0}
        className="h-11 w-full min-w-[240px] appearance-none rounded-[12px] border border-border/70 bg-card px-3.5 text-[13px] font-medium text-foreground transition focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Choose a portfolio...</option>
        {portfolios.map((portfolio) => (
          <option key={portfolio.id} value={String(portfolio.id)}>
            {portfolio.name || `Portfolio ${portfolio.id}`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PortfolioSelector;
