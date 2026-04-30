"use client";

import React from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CustomTooltip = ({ active, payload, formatAmount }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border p-2.5 rounded-[8px] text-[12px] shadow-lg">
        <p className="font-bold text-foreground mb-0.5">{d.name}</p>
        <p className="text-muted-foreground">{d.value.toFixed(1)}% ({formatAmount(d.absoluteValue)})</p>
      </div>
    );
  }
  return null;
};

export const AllocationWidget = () => {
  const { allocation, totalPortfolioValue, isLoadingTransactions, selectedPortfolio } = useDashboard();
  const { formatAmount } = useCurrency();

  if (isLoadingTransactions) return <div className="h-[280px] w-full bg-card rounded-[12px] card-shadow animate-pulse" />;
  if (!selectedPortfolio || !allocation?.length) return null;

  return (
    <div className="bg-card rounded-[12px] card-shadow p-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-5">Allocation</p>
      <div className="h-[180px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={allocation} cx="50%" cy="50%" innerRadius={54} outerRadius={74} paddingAngle={4} dataKey="value" stroke="none">
              {allocation.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip formatAmount={formatAmount} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary">Total</span>
          <span className="text-[16px] font-extrabold tracking-[-0.04em] text-foreground">{formatAmount(totalPortfolioValue, { isCompact: true })}</span>
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {allocation.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[12px] text-muted-foreground font-medium">{item.name}</span>
            </div>
            <span className="font-mono text-[12px] font-semibold text-foreground">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationWidget;
