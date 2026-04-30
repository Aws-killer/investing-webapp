"use client";

import React, { useState } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useDeletePortfolioMutation } from "@/features/api/portfoliosApi";
import { useCurrency } from "@/features/context/currency-context";
import { CreatePortfolioDialog } from "./Dialogs/CreatePortfolioDialog";
import { FinancialChart } from "@/components/ui/FinancialChart";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, ChevronDown, Trash, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const timeframes = ["1D", "1W", "1M", "6M", "YTD", "1Y", "ALL"];

export const PortfolioWidget = () => {
  const { selectedPortfolio, isLoadingPortfolios, isFetchingPerformance, performanceData, timeframe, setTimeframe, setSelectedPortfolioId } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePortfolio, { isLoading: isDeleting }] = useDeletePortfolioMutation();

  const handleDelete = async () => {
    if (!selectedPortfolio?.id) return;
    await deletePortfolio(selectedPortfolio.id);
    setIsDeleteOpen(false);
  };

  const { currentValue, timeseries } = performanceData;
  const isLoading = isLoadingPortfolios || (isFetchingPerformance && timeseries.length === 0);

  return (
    <>
      <div className="bg-card rounded-[12px] card-shadow h-[400px] flex flex-col overflow-hidden">
        {/* Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center bg-muted rounded-[6px] p-0.5 gap-0.5">
            {timeframes.map((t) => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={cn("px-2.5 py-1 text-[11px] font-bold rounded-[4px] transition-all",
                  timeframe === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >{t}</button>
            ))}
          </div>
          <div>
            {!selectedPortfolio ? (
              <button onClick={() => setIsCreateOpen(true)}
                className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-muted rounded-[6px] hover:bg-accent transition"
              >
                <Plus size={13} /> Create Portfolio
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-muted rounded-[6px] hover:bg-accent transition">
                    Options <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border shadow-lg rounded-[8px]">
                  <DropdownMenuItem className="text-[13px] font-medium text-foreground focus:bg-muted cursor-pointer">
                    <RefreshCw className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Refresh Data
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[13px] font-medium text-destructive focus:bg-destructive/10 cursor-pointer" onSelect={() => setIsDeleteOpen(true)}>
                    <Trash className="mr-2 h-3.5 w-3.5" /> Delete Portfolio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {/* Chart */}
        <div className="relative flex-1 w-full min-h-0">
          <FinancialChart data={selectedPortfolio ? timeseries : []} currentValue={currentValue} formatter={formatAmount}
            isLoading={isLoading && !!selectedPortfolio} title="Net Worth" className="absolute inset-0"
          />
        </div>
      </div>

      <CreatePortfolioDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onPortfolioCreated={(p) => setSelectedPortfolioId(p.id)} />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-popover border-border rounded-[12px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold tracking-[-0.03em] text-foreground">Delete Portfolio?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete <span className="font-bold text-foreground">{selectedPortfolio?.name}</span>. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10 rounded-[6px] bg-muted border-none text-foreground hover:bg-accent text-[12px] font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-10 rounded-[6px] bg-destructive hover:opacity-80 border-none text-[12px] font-bold">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PortfolioWidget;
