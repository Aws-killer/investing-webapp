// pages/dashboard/TransactionsWidget.jsx
"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/Providers/dashboard";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/Providers/CurrencyProvider";

// UI Components
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // For icon buttons
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";
import { Button } from "@/components/ui/button";

// Icons
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

// --- REUSABLE WIDGET WRAPPER ---
const DashboardCard = ({ children, className }) => (
  <div
    className={cn(
      "rounded-xl border border-neutral-800 bg-neutral-900", // Removed padding, will be handled by children
      className
    )}
  >
    {children}
  </div>
);

// --- STYLED SUB-COMPONENTS ---

const WidgetHeader = ({ title, description, onAdd, onExport }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
    <div>
      <h3 className="font-sans text-base font-semibold text-neutral-200">
        {title}
      </h3>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
    <div className="flex items-center gap-2 self-end sm:self-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExport}
              className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-neutral-800 text-white border-neutral-700">
            <p>Export</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

    {/* This button is now handled by the AddTransactionDialog trigger for better mobile UX */}
     <AddTransactionDialog>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-neutral-800 text-white border-neutral-700">
                <p>Add Transaction</p>
              </TooltipContent>
            </Tooltip>
        </TooltipProvider>
     </AddTransactionDialog>
    </div>
  </div>
);

const TransactionFilters = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
}) => (
  <div className="flex flex-col sm:flex-row items-center gap-3 py-3 border-y border-neutral-800">
    <div className="relative w-full flex-1">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
      <Input
        placeholder="Search transactions..."
        className="pl-8 h-9 bg-transparent border-neutral-700 focus:border-teal-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <Select value={filterType} onValueChange={onFilterChange}>
      <SelectTrigger className="w-full sm:w-36 h-9 bg-transparent border-neutral-700 hover:bg-neutral-800/50 focus:ring-0 focus:ring-offset-0">
        <Filter className="w-3.5 h-3.5 mr-2 text-neutral-500" /> <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
        <SelectItem value="All" className="focus:bg-neutral-800">
          All Types
        </SelectItem>
        <SelectItem value="BUY" className="focus:bg-neutral-800">
          Buy
        </SelectItem>
        <SelectItem value="SELL" className="focus:bg-neutral-800">
          Sell
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-16 px-6">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 mb-4">
      <ReceiptText className="h-6 w-6 text-neutral-500" />
    </div>
    <h3 className="text-md font-semibold text-neutral-100 mb-1">
      No Transactions Found
    </h3>
    <p className="text-sm text-neutral-400">
      Try adjusting your filters or add a new transaction.
    </p>
  </div>
);

// --- MOBILE & DESKTOP TRANSACTION ITEM COMPONENTS ---

// This component is optimized for mobile screens
const MobileTransactionItem = ({ tx, formatAmount, getAssetIcon }) => {
    const AssetIcon = getAssetIcon(tx.asset_type);
    const isBuy = tx.transaction_type === "BUY";

    return (
        <div className="relative flex items-center gap-3 p-2 transition-colors duration-200 hover:bg-neutral-800/50 rounded-lg">
             <div className={cn( "absolute left-0 top-2 bottom-2 w-0.5 rounded-full", isBuy ? "bg-green-500" : "bg-red-500" )} ></div>
             <div className="pl-3">
                <AssetIcon className={cn(`h-6 w-6 shrink-0`, isBuy ? "text-green-400" : "text-red-400")} />
             </div>
             <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                    <p className="font-medium text-sm text-neutral-100 truncate pr-2">
                        {tx.asset_name || `${tx.asset_type} #${tx.asset_id}`}
                    </p>
                    <p className="font-mono font-medium text-sm text-neutral-100">
                        {isBuy ? "-" : "+"}
                        {formatAmount(tx.total_amount)}
                    </p>
                </div>
                 <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-neutral-400">
                        {isBuy ? "Bought" : "Sold"}{" "}
                        {parseFloat(tx.quantity).toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                        @ {formatAmount(tx.price)}
                    </p>
                    <p className="text-xs text-neutral-500">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                    </p>
                </div>
             </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200">
                  <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-neutral-700" />
                  <DropdownMenuItem className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
        </div>
    )
}

// This component uses the original layout for larger screens
const DesktopTransactionItem = ({ tx, formatAmount, getAssetIcon }) => {
    const AssetIcon = getAssetIcon(tx.asset_type);
    const isBuy = tx.transaction_type === "BUY";
    return (
      <div className="group relative flex items-center gap-4 p-2 transition-colors duration-200 hover:bg-neutral-800/50 rounded-lg">
        <div className={cn("absolute left-0 top-2 bottom-2 w-0.5 rounded-full", isBuy ? "bg-green-500" : "bg-red-500")}></div>
        <div className="pl-4 flex-1 grid grid-cols-12 items-center gap-4">
          <div className="col-span-5 flex items-center gap-3">
            <AssetIcon className={cn(`h-5 w-5 shrink-0`, isBuy ? "text-green-400" : "text-red-400")} />
            <div>
              <p className="font-medium text-sm text-neutral-100">{tx.asset_name || `${tx.asset_type} #${tx.asset_id}`}</p>
              <p className="text-xs text-neutral-400">{tx.asset_symbol || tx.asset_type}</p>
            </div>
          </div>
          <div className="col-span-3 text-xs text-neutral-400">
            {isBuy ? "Bought" : "Sold"} {parseFloat(tx.quantity).toLocaleString(undefined, { maximumFractionDigits: 4 })} @ {formatAmount(tx.price)}
          </div>
          <div className="col-span-4 flex items-center justify-end gap-2">
            <div className="text-right">
              <p className="font-mono font-medium text-sm text-neutral-100">
                {isBuy ? "-" : "+"}
                {formatAmount(tx.total_amount)}
              </p>
              <p className="text-xs text-neutral-500">{new Date(tx.transaction_date).toLocaleDateString()}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200">
                <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-neutral-700" />
                <DropdownMenuItem className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
}


// --- MAIN TRANSACTIONS WIDGET ---

export  const TransactionsWidget = () => {
  const {
    transactions,
    isLoadingTransactions,
    selectedPortfolio,
    selectedPortfolioId,
  } = useDashboard();
  const { formatAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] =
    useState(false);
  const [filterType, setFilterType] = useState("All");

  const groupedTransactions = useMemo(() => {
    if (!selectedPortfolio || !transactions) return {};
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = transactions.filter(
      (tx) =>
        (tx.asset_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
          tx.asset_symbol?.toLowerCase().includes(lowerCaseSearchTerm) ||
          tx.asset_type.toLowerCase().includes(lowerCaseSearchTerm) ||
          String(tx.asset_id).includes(lowerCaseSearchTerm)) &&
        (filterType === "All" || tx.transaction_type === filterType)
    );
    return filtered.reduce((acc, tx) => {
      const groupKey = new Date(tx.transaction_date).toLocaleDateString(
        undefined,
        { year: "numeric", month: "long" }
      );
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(tx);
      return acc;
    }, {});
  }, [transactions, searchTerm, filterType, selectedPortfolio]);

  const getAssetIcon = (assetType) => {
    const map = { STOCK: Building2, UTT: BarChart3, CRYPTO: Coins };
    return map[assetType] || Wallet;
  };

  if (isLoadingTransactions && selectedPortfolio) {
    return (
      <DashboardCard className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32 bg-neutral-800" />
            <Skeleton className="h-8 w-16 bg-neutral-800" />
          </div>
          <Skeleton className="h-10 w-full bg-neutral-800" />
          <Skeleton className="h-14 w-full bg-neutral-800" />
          <Skeleton className="h-14 w-full bg-neutral-800" />
        </div>
      </DashboardCard>
    );
  }

  if (!selectedPortfolio) return null;

  return (
    <>
      <DashboardCard>
        <div className="p-4 flex flex-col gap-4">
          <WidgetHeader
            title="Transactions"
            description="A log of all your portfolio activities."
            onAdd={() => setIsAddTransactionDialogOpen(true)}
            onExport={() => alert("Exporting not implemented.")}
          />
          <TransactionFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
          />

          <div className="max-h-[26rem] overflow-y-auto pr-2 -mr-2">
            {Object.keys(groupedTransactions).length === 0 ? (
              <EmptyState />
            ) : (
              Object.entries(groupedTransactions).map(
                ([groupKey, txsInGroup]) => (
                  <div key={groupKey} className="mb-4 last:mb-0">
                    <h3 className="px-2 pb-2 text-xs font-semibold text-neutral-500 tracking-wider">
                      {groupKey}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {txsInGroup.map((tx) => (
                        <React.Fragment key={tx.id}>
                            {/* Show mobile-optimized view on small screens */}
                           <div className="md:hidden">
                                <MobileTransactionItem tx={tx} formatAmount={formatAmount} getAssetIcon={getAssetIcon}/>
                           </div>
                            {/* Show original desktop view on medium screens and up */}
                           <div className="hidden md:block">
                                <DesktopTransactionItem tx={tx} formatAmount={formatAmount} getAssetIcon={getAssetIcon}/>
                           </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </DashboardCard>
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

export default TransactionsWidget;