"use client";

import React, { useState } from "react";
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Plus, Building2, Wallet } from "lucide-react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";

const PositionItem = ({ pos, formatAmount }) => {
  const isPositive = pos.profit_loss >= 0;
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-background transition-colors border-b border-border last:border-0 cursor-pointer">
      <div className="flex items-center gap-3.5">
        <div className="h-9 w-9 rounded-[8px] bg-muted flex items-center justify-center text-muted-foreground">
          {pos.asset_type === "STOCK" ? <Building2 size={16} /> : <Wallet size={16} />}
        </div>
        <div>
          <div className="text-[13px] font-bold text-foreground">{pos.asset_symbol}</div>
          <div className="text-[11px] text-tertiary font-medium">{pos.asset_name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[13px] font-semibold text-foreground">{formatAmount(pos.current_value)}</div>
        <div className={cn("flex items-center justify-end gap-0.5 text-[11px] font-semibold mt-0.5", isPositive ? "text-emerald-500" : "text-red-500")}>
          {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
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

  if (isLoadingPositions) return <div className="h-[300px] w-full bg-card rounded-[12px] card-shadow animate-pulse" />;
  if (!selectedPortfolio) return null;

  return (
    <>
      <div className="bg-card rounded-[12px] card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Positions</span>
          <button onClick={() => setIsAddDialogOpen(true)}
            className="h-7 w-7 flex items-center justify-center rounded-[6px] bg-muted hover:bg-accent text-muted-foreground transition"
          >
            <Plus size={14} />
          </button>
        </div>
        <div>
          {positions.length === 0
            ? <div className="px-5 py-10 text-center text-[13px] text-tertiary font-medium">No positions yet. Add a transaction to get started.</div>
            : positions.map((pos, i) => <PositionItem key={`${pos.asset_id}-${i}`} pos={pos} formatAmount={formatAmount} />)
          }
        </div>
      </div>
      {selectedPortfolioId && <AddTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} portfolioIdFromWidget={selectedPortfolioId} />}
    </>
  );
};

export default PositionsWidget;
