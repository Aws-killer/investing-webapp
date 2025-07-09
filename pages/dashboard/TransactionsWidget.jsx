// pages/dashboard/TransactionsWidget.jsx
"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/Providers/dashboard";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  FileDown,
  Filter,
  Coins,
  Building2,
  MoreHorizontal,
  Edit,
  Trash2,
  BarChart3,
  Wallet,
  ReceiptText,
} from "lucide-react";
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";

export const TransactionsWidget = () => {
  const {
    transactions,
    isLoadingTransactions,
    selectedPortfolio,
    selectedPortfolioId,
  } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] =
    useState(false);
  const [filterType, setFilterType] = useState("All");

  const groupedTransactions = useMemo(() => {
    if (!selectedPortfolio || !transactions) return {};
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = transactions.filter(
      (tx) =>
        ((tx.asset_name &&
          tx.asset_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (tx.asset_symbol &&
            tx.asset_symbol.toLowerCase().includes(lowerCaseSearchTerm)) ||
          tx.asset_type.toLowerCase().includes(lowerCaseSearchTerm) ||
          (tx.notes && tx.notes.toLowerCase().includes(lowerCaseSearchTerm)) ||
          String(tx.asset_id).includes(lowerCaseSearchTerm)) &&
        (filterType === "All" || tx.transaction_type === filterType)
    );
    return filtered.reduce((acc, tx) => {
      const date = new Date(tx.transaction_date);
      const groupKey = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      });
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(tx);
      return acc;
    }, {});
  }, [transactions, searchTerm, filterType, selectedPortfolio]);

  const getAssetIcon = (assetType) => {
    switch (assetType) {
      case "STOCK":
        return Building2;
      case "UTT":
        return BarChart3;
      case "CRYPTO":
        return Coins;
      default:
        return Wallet;
    }
  };

  if (isLoadingTransactions && selectedPortfolio) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-64 mt-2 bg-zinc-800" />
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full bg-zinc-800" />
          <Skeleton className="h-14 w-full bg-zinc-800" />
          <Skeleton className="h-14 w-full bg-zinc-800" />
          <Skeleton className="h-14 w-full bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedPortfolio) return null;

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-300">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-zinc-50">
                Transactions
              </CardTitle>
              <CardDescription className="mt-1">
                A log of all your portfolio activities.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-zinc-700 hover:bg-zinc-800 hover:text-zinc-50"
              >
                <FileDown className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button
                size="sm"
                className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
                onClick={() => setIsAddTransactionDialogOpen(true)}
                disabled={!selectedPortfolioId}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 py-4 border-y border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search asset or symbol..."
                className="pl-10 bg-zinc-800 border-zinc-700 focus:border-zinc-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700">
                <Filter className="w-4 h-4 mr-2" /> <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
                <SelectItem value="All" className="focus:bg-zinc-700">
                  All Types
                </SelectItem>
                <SelectItem value="BUY" className="focus:bg-zinc-700">
                  Buy
                </SelectItem>
                <SelectItem value="SELL" className="focus:bg-zinc-700">
                  Sell
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-2 sm:p-4">
          {Object.keys(groupedTransactions).length === 0 &&
          !isLoadingTransactions ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 mb-4">
                <ReceiptText className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50 mb-1">
                No Transactions Found
              </h3>
              <p className="text-zinc-400">
                Try adjusting your filters or add a new transaction.
              </p>
            </div>
          ) : (
            Object.entries(groupedTransactions).map(
              ([groupKey, txsInGroup]) => (
                <div key={groupKey} className="mb-6 last:mb-0">
                  <h3 className="px-2 pb-2 text-sm font-semibold text-zinc-400">
                    {groupKey}
                  </h3>
                  <div className="flex flex-col">
                    {txsInGroup.map((tx) => {
                      const AssetIcon = getAssetIcon(tx.asset_type);
                      const isBuy = tx.transaction_type === "BUY";
                      return (
                        <div
                          key={tx.id}
                          className="group grid grid-cols-12 items-center gap-4 px-2 py-3 transition-colors duration-200 hover:bg-zinc-800/50 rounded-lg"
                        >
                          <div className="col-span-12 sm:col-span-5 flex items-center space-x-4">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                isBuy ? "bg-rose-500/10" : "bg-teal-500/10"
                              }`}
                            >
                              <AssetIcon
                                className={`h-5 w-5 ${
                                  isBuy ? "text-rose-400" : "text-teal-400"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-50">
                                {tx.asset_name ||
                                  `${tx.asset_type} #${tx.asset_id}`}
                              </p>
                              <p className="text-sm text-zinc-400">
                                {tx.asset_symbol || tx.asset_type}
                              </p>
                            </div>
                          </div>
                          <div className="hidden md:block col-span-4 text-sm text-zinc-400">
                            {isBuy ? "Bought" : "Sold"}{" "}
                            {parseFloat(tx.quantity).toLocaleString(undefined, {
                              maximumFractionDigits: 4,
                            })}{" "}
                            @ €{parseFloat(tx.price).toFixed(2)}
                          </div>
                          <div className="col-span-12 sm:col-span-3 flex items-center justify-end space-x-4">
                            <div className="text-right">
                              <p
                                className={`font-mono font-medium ${
                                  isBuy ? "text-rose-400" : "text-teal-400"
                                }`}
                              >
                                {isBuy ? "-" : "+"}€
                                {parseFloat(tx.total_amount).toLocaleString(
                                  "de-DE",
                                  { minimumFractionDigits: 2 }
                                )}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {new Date(
                                  tx.transaction_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-zinc-800 border-zinc-700 text-zinc-300"
                              >
                                <DropdownMenuItem className="focus:bg-zinc-700 focus:text-zinc-50">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-700" />
                                <DropdownMenuItem className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )
          )}
        </CardContent>
      </Card>
      {selectedPortfolioId && (
        <AddTransactionDialog
          isOpen={isAddTransactionDialogOpen}
          onOpenChange={setIsAddTransactionDialogOpen}
          portfolioIdFromWidget={selectedPortfolioId}
        />
      )}
    </>
  );
};
