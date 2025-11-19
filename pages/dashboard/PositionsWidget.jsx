// pages/dashboard/PositionsWidget.jsx
"use client";

import React, { useState } from "react";
import { useDashboard } from "@/Providers/dashboard";
import { useCurrency } from "@/Providers/CurrencyProvider";
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Plus, Building2, Wallet } from "lucide-react";

// --- SUB COMPONENTS ---

const WidgetCard = ({ children, title, action }) => (
  <div className="bg-[#121212] rounded-xl border border-zinc-800 overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
        <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
        {action}
    </div>
    {children}
  </div>
);

const PositionItem = ({ pos, formatAmount }) => {
    const isPositive = pos.profit_loss >= 0;
    return (
        <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors border-b border-zinc-800/50 last:border-0 cursor-pointer group">
            {/* Left: Icon & Info */}
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700/50">
                    {pos.asset_type === 'STOCK' ? <Building2 size={18} /> : <Wallet size={18} />}
                </div>
                <div>
                    <div className="font-bold text-sm text-zinc-100">{pos.asset_symbol}</div>
                    <div className="text-xs text-zinc-500">{pos.asset_name}</div>
                </div>
            </div>

            {/* Right: Value & PL */}
            <div className="text-right">
                <div className="font-mono font-medium text-sm text-zinc-200">
                    {formatAmount(pos.current_value)}
                </div>
                <div className={cn("flex items-center justify-end gap-1 text-xs font-medium mt-0.5", isPositive ? "text-emerald-400" : "text-red-400")}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {formatAmount(pos.profit_loss)} ({pos.profit_loss_percent}%)
                </div>
            </div>
        </div>
    );
};

export const PositionsWidget = () => {
  const { positions, isLoadingPositions, selectedPortfolio, selectedPortfolioId } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (isLoadingPositions) return <Skeleton className="h-[400px] w-full bg-zinc-900 rounded-xl" />;
  if (!selectedPortfolio) return null;

  return (
    <>
      <WidgetCard 
        title="Positions" 
        action={
            <button 
                onClick={() => setIsAddDialogOpen(true)}
                className="h-7 w-7 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
            >
                <Plus size={16} />
            </button>
        }
      >
        <div className="flex flex-col">
            {positions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                    No positions yet. Add a transaction to get started.
                </div>
            ) : (
                positions.map((pos, i) => (
                    <PositionItem key={`${pos.asset_id}-${i}`} pos={pos} formatAmount={formatAmount} />
                ))
            )}
        </div>
      </WidgetCard>

      {selectedPortfolioId && (
         <AddTransactionDialog 
            isOpen={isAddDialogOpen} 
            onOpenChange={setIsAddDialogOpen} 
            portfolioIdFromWidget={selectedPortfolioId} 
         />
      )}
    </>
  );
};

export default PositionsWidget;