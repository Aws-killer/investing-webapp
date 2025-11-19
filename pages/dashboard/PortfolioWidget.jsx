// pages/dashboard/PortfolioWidget.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/Providers/dashboard";
import { useDeletePortfolioMutation } from "@/features/api/portfoliosApi";
import { useCurrency } from "@/Providers/CurrencyProvider";
import { CreatePortfolioDialog } from "./Dialogs/CreatePortfolioDialog";

// UI & Charts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
  Tooltip,
  XAxis,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Settings, ArrowUpRight, ArrowDownRight, Trash, MoreHorizontal, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// --- COMPONENTS ---

const WidgetCard = ({ children, className }) => (
  <div className={cn("relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-zinc-800 shadow-2xl p-6", className)}>
    {children}
  </div>
);

const ChartTooltip = ({ active, payload, label, formatAmount }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121212] border border-zinc-800 p-2 rounded-lg shadow-xl">
        <p className="text-xs text-zinc-400 mb-1">{label}</p>
        <p className="font-bold text-white text-sm">{formatAmount(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export const PortfolioWidget = () => {
  const {
    userId,
    selectedPortfolio,
    isLoadingPortfolios,
    isFetchingPerformance,
    performanceData,
    timeframe,
    setTimeframe,
    setSelectedPortfolioId,
  } = useDashboard();
  const { formatAmount } = useCurrency();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePortfolio, { isLoading: isDeleting }] = useDeletePortfolioMutation();

  const handleDelete = async () => {
    if (!selectedPortfolio?.id) return;
    await deletePortfolio({ portfolioId: selectedPortfolio.id, userId });
    setIsDeleteOpen(false);
  };

  const { currentValue, changeValue, changePercentage, timeseries } = performanceData;
  const isPositive = changeValue >= 0;
  const isLoading = isLoadingPortfolios || (isFetchingPerformance && timeseries.length === 0);

  if (isLoading && !selectedPortfolio) {
    return (
      <WidgetCard>
        <Skeleton className="h-8 w-1/3 mb-4 bg-zinc-800" />
        <Skeleton className="h-12 w-1/2 mb-6 bg-zinc-800" />
        <Skeleton className="h-64 w-full bg-zinc-800" />
      </WidgetCard>
    );
  }

  return (
    <>
      <WidgetCard className="min-h-[320px]">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-1">
                   {selectedPortfolio ? "Net Worth" : "No Portfolio"}
                </h2>
                <div className="flex items-baseline gap-3">
                     <span className="text-5xl font-bold text-white tracking-tight font-mono">
                        {selectedPortfolio ? formatAmount(currentValue) : "---"}
                     </span>
                     {selectedPortfolio && (
                         <span className={cn("flex items-center text-sm font-medium px-2 py-1 rounded-full bg-white/5", isPositive ? "text-emerald-400" : "text-red-400")}>
                             {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                             {Math.abs(changePercentage).toFixed(2)}%
                         </span>
                     )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus size={20} />
                 </Button>
                 
                 {selectedPortfolio && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                <Settings size={20} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#121212] border-zinc-800 text-zinc-200">
                            <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer">
                                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-red-900/20 text-red-400 focus:text-red-400 cursor-pointer" onSelect={() => setIsDeleteOpen(true)}>
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 )}
            </div>
        </div>

        {/* Chart Area */}
        <div className="h-[180px] w-full relative">
             {!selectedPortfolio ? (
                 <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                     Create a portfolio to start tracking
                 </div>
             ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeseries}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip content={<ChartTooltip formatAmount={formatAmount} />} cursor={{ stroke: '#333', strokeDasharray: '3 3' }} />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={isPositive ? "#10b981" : "#ef4444"} 
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                            strokeWidth={2}
                        />
                    </AreaChart>
                 </ResponsiveContainer>
             )}
        </div>

        {/* Timeframe Selector */}
        {selectedPortfolio && (
            <div className="flex justify-end mt-4 gap-1">
                {["1D", "1W", "1M", "YTD", "1Y", "ALL"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={cn(
                            "text-[10px] font-bold px-3 py-1 rounded-md transition-colors",
                            timeframe === t 
                                ? "bg-zinc-800 text-white" 
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>
        )}

      </WidgetCard>

      <CreatePortfolioDialog 
        isOpen={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onPortfolioCreated={(p) => setSelectedPortfolioId(p.id)} 
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] border-zinc-800 text-white">
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Portfolio?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                    This action cannot be undone. This will permanently delete <span className="text-white font-bold">{selectedPortfolio?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 border-none">
                    {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};