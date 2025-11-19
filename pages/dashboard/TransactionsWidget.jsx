// pages/dashboard/TransactionsWidget.jsx
"use client";

import React, { useState } from "react";
import { useDashboard } from "@/Providers/dashboard";
import { useCurrency } from "@/Providers/CurrencyProvider";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, Plus, Search } from "lucide-react";
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const WidgetCard = ({ children, title, action }) => (
  <div className="bg-[#121212] rounded-xl border border-zinc-800 overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
        <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
        {action}
    </div>
    {children}
  </div>
);

const TransactionItem = ({ tx, formatAmount }) => {
    const isBuy = tx.transaction_type === "BUY";
    return (
        <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors border-b border-zinc-800/50 last:border-0">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border",
                    isBuy ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                )}>
                    {isBuy ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                    <div className="font-bold text-sm text-zinc-100">
                        {isBuy ? "Bought" : "Sold"} {tx.asset_symbol}
                    </div>
                    <div className="text-xs text-zinc-500">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className={cn("font-mono font-medium text-sm", isBuy ? "text-zinc-200" : "text-emerald-400")}>
                    {isBuy ? "-" : "+"}{formatAmount(tx.total_amount)}
                </div>
                <div className="text-xs text-zinc-600">
                    {parseFloat(tx.quantity).toFixed(2)} @ {formatAmount(tx.price)}
                </div>
            </div>
        </div>
    )
}

export const TransactionsWidget = () => {
  const { transactions, isLoadingTransactions, selectedPortfolio, selectedPortfolioId } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (isLoadingTransactions) return <Skeleton className="h-[300px] w-full bg-zinc-900 rounded-xl" />;
  if (!selectedPortfolio) return null;

  const filteredTx = transactions 
    ? transactions.filter(t => t.asset_symbol.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <>
      <WidgetCard
        title="Recent Transactions"
        action={
            <button 
                onClick={() => setIsAddDialogOpen(true)}
                className="text-xs text-emerald-400 hover:underline font-medium"
            >
                Add New
            </button>
        }
      >
         <div className="flex flex-col p-2">
             <div className="relative mb-2 px-2">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                 <Input 
                     placeholder="Filter..." 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="pl-9 h-9 w-full bg-zinc-900 border-zinc-700 text-zinc-300 focus:border-emerald-500/50"
                 />
             </div>

             {filteredTx.length === 0 ? (
                 <div className="p-8 text-center text-zinc-500 text-sm">No transactions found.</div>
             ) : (
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                     {filteredTx.slice(0, 8).map(tx => (
                         <TransactionItem key={tx.id} tx={tx} formatAmount={formatAmount} />
                     ))}
                 </div>
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

export default TransactionsWidget;