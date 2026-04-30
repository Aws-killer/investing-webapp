"use client";

import React, { useState } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";

const TransactionItem = ({ tx, formatAmount }) => {
  const isBuy = tx.transaction_type === "BUY";
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-background transition-colors border-b border-border last:border-0">
      <div className="flex items-center gap-3.5">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", isBuy ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>
          {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
        </div>
        <div>
          <div className="text-[13px] font-bold text-foreground">{isBuy ? "Bought" : "Sold"} {tx.asset_symbol}</div>
          <div className="text-[11px] text-tertiary font-medium">{new Date(tx.transaction_date).toLocaleDateString()}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("font-mono text-[13px] font-semibold", isBuy ? "text-foreground" : "text-emerald-500")}>
          {isBuy ? "-" : "+"}{formatAmount(tx.total_amount)}
        </div>
        <div className="text-[11px] text-tertiary font-medium">{parseFloat(tx.quantity).toFixed(2)} @ {formatAmount(tx.price)}</div>
      </div>
    </div>
  );
};

export const TransactionsWidget = () => {
  const { transactions, isLoadingTransactions, selectedPortfolio, selectedPortfolioId } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (isLoadingTransactions) return <div className="h-[300px] w-full bg-card rounded-[12px] card-shadow animate-pulse" />;
  if (!selectedPortfolio) return null;

  const filteredTx = transactions ? transactions.filter((t) => t.asset_symbol?.toLowerCase().includes(search.toLowerCase())) : [];

  return (
    <>
      <div className="bg-card rounded-[12px] card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Recent Transactions</span>
          <button onClick={() => setIsAddDialogOpen(true)} className="text-[11px] font-bold text-link hover:underline">Add New</button>
        </div>
        <div className="px-5 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary" />
            <input placeholder="Filter transactions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 bg-muted rounded-[6px] pl-9 pr-3 text-[13px] font-medium text-foreground placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </div>
        <div>
          {filteredTx.length === 0
            ? <div className="px-5 py-10 text-center text-[13px] text-tertiary font-medium">No transactions found.</div>
            : <div className="max-h-[300px] overflow-y-auto">{filteredTx.slice(0, 8).map((tx) => <TransactionItem key={tx.id} tx={tx} formatAmount={formatAmount} />)}</div>
          }
        </div>
      </div>
      {selectedPortfolioId && <AddTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} portfolioIdFromWidget={selectedPortfolioId} />}
    </>
  );
};

export default TransactionsWidget;
