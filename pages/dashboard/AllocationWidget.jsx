// pages/dashboard/AllocationWidget.jsx
"use client";

import React from "react";
import { useDashboard } from "@/Providers/dashboard";
import { useCurrency } from "@/Providers/CurrencyProvider";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const WidgetCard = ({ children, className }) => (
  <div className={cn("bg-[#121212] rounded-xl border border-zinc-800 p-5", className)}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, formatAmount }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/90 border border-zinc-800 p-2 rounded text-xs shadow-lg">
        <p className="font-bold text-white mb-1">{data.name}</p>
        <p className="text-zinc-400">{data.value.toFixed(1)}% ({formatAmount(data.absoluteValue)})</p>
      </div>
    );
  }
  return null;
};

export const AllocationWidget = () => {
  const { allocation, totalPortfolioValue, isLoadingTransactions, selectedPortfolio } = useDashboard();
  const { formatAmount } = useCurrency();

  if (isLoadingTransactions) return <Skeleton className="h-[300px] w-full bg-zinc-900 rounded-xl" />;
  if (!selectedPortfolio || !allocation?.length) return null;

  return (
    <WidgetCard>
      <h3 className="text-sm font-bold text-zinc-100 mb-6">Allocation</h3>
      
      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                >
                    {allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatAmount={formatAmount} />} />
            </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total</span>
            <span className="text-lg font-bold text-white">{formatAmount(totalPortfolioValue, { isCompact: true })}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-3">
        {allocation.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-300 font-medium">{item.name}</span>
                </div>
                <span className="font-mono text-zinc-400">{item.value.toFixed(1)}%</span>
            </div>
        ))}
      </div>
    </WidgetCard>
  );
};

export default AllocationWidget;