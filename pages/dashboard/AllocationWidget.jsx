// pages/dashboard/AllocationWidget.jsx
"use client";

import React from "react";
import { useDashboard } from "@/Providers/dashboard";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/Providers/CurrencyProvider";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

// --- REUSABLE WIDGET WRAPPER (Modified for Glass effect) ---
const DashboardCard = ({ children, className }) => (
  <div
    className={cn(
      "rounded-xl border border-neutral-800 bg-neutral-900 p-6",
      className
    )}
  >
    {children}
  </div>
);

// --- STYLED SUB-COMPONENTS for this widget ---

const PremiumBadge = () => (
  <div className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2 py-0.5 rounded-full">
    PRO
  </div>
);

const WidgetHeader = ({ title }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <PieChartIcon className="h-4 w-4 text-neutral-400" />
      <h3 className="font-sans text-base font-semibold text-neutral-200">
        {title}
      </h3>
    </div>
    <PremiumBadge />
  </div>
);

const StyledTabs = ({ children }) => (
  <Tabs defaultValue="type" className="mt-4">
    <TabsList className="bg-transparent p-0 h-auto gap-4">
      <TabsTrigger
        value="type"
        className="bg-transparent text-sm text-neutral-400 p-0 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 border-white rounded-none"
      >
        By Type
      </TabsTrigger>
      <TabsTrigger
        value="positions"
        className="bg-transparent text-sm text-neutral-400 p-0 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 border-white rounded-none"
      >
        By Position
      </TabsTrigger>
    </TabsList>
    <TabsContent value="type" className="mt-4">
      {children}
    </TabsContent>
    {/* You can add another TabsContent for "positions" here when ready */}
  </Tabs>
);

const CustomTooltip = ({ active, payload, formatAmount }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-md border border-neutral-700 bg-neutral-950/80 p-2 text-xs shadow-lg backdrop-blur-sm">
        <p className="font-bold text-white">{data.name}</p>
        <p className="text-neutral-300">
          {`${data.value.toFixed(2)}% (${formatAmount(data.absoluteValue)})`}
        </p>
      </div>
    );
  }
  return null;
};

const EmptyState = () => (
  <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
    No allocation data to display.
  </div>
);

// --- MAIN ALLOCATION WIDGET ---

export const AllocationWidget = () => {
  const {
    allocation,
    totalPortfolioValue,
    isLoadingTransactions,
    selectedPortfolio,
  } = useDashboard();
  const { formatAmount } = useCurrency();

  if (isLoadingTransactions && selectedPortfolio) {
    return (
      <DashboardCard>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="h-5 w-12 bg-white/10" />
        </div>
        <Skeleton className="h-10 w-full bg-white/10 mb-4" />
        <Skeleton className="h-48 w-full bg-white/10" />
      </DashboardCard>
    );
  }
  if (!selectedPortfolio) return null;

  const hasAllocationData = allocation && allocation.length > 0;

  return (
    <DashboardCard>
      <WidgetHeader title="Allocation" />

      <StyledTabs>
        <div className="h-64 w-full mt-2 relative">
          {hasAllocationData ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="85%"
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={450}
                  >
                    {allocation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip formatAmount={formatAmount} />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-neutral-400 font-semibold">
                  Total Value
                </p>
                <p className="text-2xl font-bold font-mono text-white">
                  {formatAmount(totalPortfolioValue)}
                </p>
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>

        {hasAllocationData && (
          <div className="mt-4 space-y-2">
            {allocation.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-neutral-300">{item.name}</span>
                </div>
                <span className="font-mono text-neutral-100">
                  {item.value.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </StyledTabs>
    </DashboardCard>
  );
};
export default AllocationWidget;