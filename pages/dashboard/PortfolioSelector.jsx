"use client";
import React from "react";
import { useDashboard } from "@/features/context/dashboard-context";

export const PortfolioSelector = () => {
  const { portfolios, selectedPortfolioId, setSelectedPortfolioId, isLoadingPortfolios } = useDashboard();

  if (isLoadingPortfolios) return <div className="h-11 w-72 bg-card rounded-[6px] card-shadow animate-pulse mb-5" />;
  if (!portfolios || portfolios.length === 0) return (
    <p className="text-[13px] text-muted-foreground font-medium mb-5">No portfolios yet — create one to get started.</p>
  );

  return (
    <div className="mb-5">
      <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">Portfolio</label>
      <select
        value={selectedPortfolioId ? String(selectedPortfolioId) : ""}
        onChange={(e) => setSelectedPortfolioId(e.target.value ? Number(e.target.value) : null)}
        disabled={isLoadingPortfolios || portfolios.length === 0}
        className="w-full md:w-72 h-11 bg-input rounded-[6px] px-3.5 text-[13px] font-medium text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring transition appearance-none cursor-pointer card-shadow"
      >
        <option value="">Choose a portfolio...</option>
        {portfolios.map((p) => <option key={p.id} value={String(p.id)}>{p.name || `Portfolio ${p.id}`}</option>)}
      </select>
    </div>
  );
};

export default PortfolioSelector;
