// pages/dashboard/PortfolioSelector.jsx
"use client";

import React from "react";
import { useDashboard } from "@/Providers/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PortfolioSelector = () => {
  const {
    portfolios,
    selectedPortfolioId,
    setSelectedPortfolioId,
    isLoadingPortfolios,
  } = useDashboard();

  if (isLoadingPortfolios) {
    return <Skeleton className="h-10 w-64 mb-4" />;
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <p className="text-muted-foreground mb-4">
        No portfolios available. Create one to get started!
      </p>
    );
  }

  return (
    <div className="mb-6">
      <label
        htmlFor="portfolio-select"
        className="block text-sm font-medium text-muted-foreground mb-1"
      >
        Select Portfolio
      </label>
      <Select
        value={selectedPortfolioId ? String(selectedPortfolioId) : ""}
        onValueChange={(value) =>
          setSelectedPortfolioId(value ? Number(value) : null)
        }
        disabled={isLoadingPortfolios || portfolios.length === 0}
      >
        <SelectTrigger className="w-full md:w-[320px]" id="portfolio-select">
          <SelectValue placeholder="Choose a portfolio..." />
        </SelectTrigger>
        <SelectContent>
          {portfolios.map((portfolio) => (
            <SelectItem key={portfolio.id} value={String(portfolio.id)}>
              {portfolio.name || `Portfolio ${portfolio.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
