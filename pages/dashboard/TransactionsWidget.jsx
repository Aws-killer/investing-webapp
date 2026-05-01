"use client";

import React, { useState } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { AddTransactionDialog } from "@/components/dashboard/AddTransactionDialog";

const formatDate = (value) => {
  if (!value) return "n/a";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

const formatQuantity = (value, assetType) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0";
  const maximumFractionDigits = String(assetType || "").toUpperCase() === "STOCK" ? 0 : 2;
  return numberValue.toLocaleString(undefined, { maximumFractionDigits });
};

const TransactionItem = ({ tx, formatAmount }) => {
  const isBuy = tx.transaction_type === "BUY";
  return (
    <tr className="border-b border-border/80 last:border-0 hover:bg-background/80 transition-colors">
      <td className="px-5 py-3.5 text-[12px] font-semibold text-muted-foreground whitespace-nowrap">{formatDate(tx.transaction_date)}</td>
      <td className="min-w-[220px] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={cn("h-8 w-8 rounded-[8px] flex items-center justify-center", isBuy ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
            {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
          </div>
          <div>
            <div className="text-[13px] font-bold text-foreground">{tx.asset_symbol || "N/A"}</div>
            <div className="max-w-[190px] truncate text-[11px] text-tertiary font-medium">{tx.asset_name || tx.asset_type}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className={cn("inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", isBuy ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
          {tx.transaction_type}
        </span>
      </td>
      <td className="px-4 py-3.5 text-[12px] text-muted-foreground whitespace-nowrap">{tx.asset_type}</td>
      <td className="px-4 py-3.5 text-right font-mono text-[12px] text-foreground whitespace-nowrap">{formatQuantity(tx.quantity, tx.asset_type)}</td>
      <td className="px-4 py-3.5 text-right font-mono text-[12px] text-muted-foreground whitespace-nowrap">{formatAmount(tx.price)}</td>
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <div className={cn("font-mono text-[13px] font-semibold", isBuy ? "text-foreground" : "text-emerald-500")}>
          {isBuy ? "-" : "+"}{formatAmount(tx.total_amount)}
        </div>
      </td>
    </tr>
  );
};

export const TransactionsWidget = () => {
  const { transactions, isLoadingTransactions, selectedPortfolio, selectedPortfolioId } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (isLoadingTransactions) return <div className="h-[300px] w-full bg-card rounded-[12px] card-shadow animate-pulse" />;
  if (!selectedPortfolio) return null;

  const filteredTx = transactions ? transactions.filter((t) => {
    const query = search.toLowerCase();
    return [
      t.asset_symbol,
      t.asset_name,
      t.asset_type,
      t.transaction_type,
      t.transaction_date,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
  }) : [];

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
            : (
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full min-w-[820px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border bg-background/60">
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Asset</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Action</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Type</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Quantity</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Price</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.slice(0, 12).map((tx) => <TransactionItem key={tx.id} tx={tx} formatAmount={formatAmount} />)}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
      {selectedPortfolioId && <AddTransactionDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} portfolioIdFromWidget={selectedPortfolioId} />}
    </>
  );
};

export default TransactionsWidget;
