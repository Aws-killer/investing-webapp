// pages/dashboard/PositionsWidget.jsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDashboard } from "@/Providers/dashboard";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/Providers/CurrencyProvider";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";

// Icons
import {
  Plus,
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Table as TableIcon,
  Layers,
} from "lucide-react";

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

const WidgetHeader = ({ title, onAdd }) => (
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-2.5">
      <Layers className="h-4 w-4 text-neutral-400" />
      <h3 className="font-sans text-base font-semibold text-neutral-200">
        {title}
      </h3>
    </div>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onAdd}
            className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-neutral-800 text-white border-neutral-700">
          <p>Add Transaction</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

const StyledTabs = ({ children }) => (
  <Tabs defaultValue="alltime">
    <TabsList className="bg-transparent p-0 h-auto gap-4">
      <TabsTrigger
        value="alltime"
        className="bg-transparent text-sm text-neutral-400 p-0 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 border-white rounded-none"
      >
        All-time
      </TabsTrigger>
      <TabsTrigger
        value="intraday"
        disabled
        className="bg-transparent text-sm text-neutral-600 p-0 cursor-not-allowed"
      >
        Intraday
      </TabsTrigger>
    </TabsList>
    <TabsContent value="alltime" className="mt-4">
      {children}
    </TabsContent>
  </Tabs>
);

const EmptyState = ({ onAdd }) => (
  <div className="text-center py-16 px-6">
    <h3 className="text-md font-semibold text-neutral-100 mb-1">
      No Positions Found
    </h3>
    <p className="text-sm text-neutral-400 mb-4">
      Add a transaction to see your positions here.
    </p>
    <button
      onClick={onAdd}
      className="text-sm font-semibold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md"
    >
      Add Transaction
    </button>
  </div>
);

const Sparkline = ({ data, color }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

// --- MAIN POSITIONS WIDGET ---

export const PositionsWidget = () => {
  const {
    positions,
    isLoadingPositions,
    selectedPortfolio,
    selectedPortfolioId,
  } = useDashboard();
  const { formatAmount } = useCurrency();
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] =
    useState(false);

  // Animation variants for Framer Motion
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoadingPositions && selectedPortfolio) {
    return (
      <DashboardCard>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32 bg-white/10" />
            <Skeleton className="h-8 w-8 bg-white/10 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full bg-white/10" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/10" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (!selectedPortfolio) return null;

  return (
    <>
      <DashboardCard>
        <div className="flex flex-col gap-4">
          <WidgetHeader
            title="Positions"
            onAdd={() => setIsAddTransactionDialogOpen(true)}
          />
          <StyledTabs>
            {positions.length === 0 ? (
              <EmptyState onAdd={() => setIsAddTransactionDialogOpen(true)} />
            ) : (
              <div className="max-h-[26rem] overflow-y-auto -mr-4 pr-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead className="w-[30%] text-neutral-500 font-semibold">
                        Asset
                      </TableHead>
                      <TableHead className="w-[20%] text-center text-neutral-500 font-semibold">
                        Trend (7D)
                      </TableHead>
                      <TableHead className="text-right text-neutral-500 font-semibold">
                        Value
                      </TableHead>
                      <TableHead className="text-right text-neutral-500 font-semibold">
                        P/L
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <motion.tbody
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {positions.map((pos) => {
                      const isPositive = pos.profit_loss >= 0;
                      const trendColor = isPositive ? "#22c55e" : "#ef4444";
                      const mockTrendData = [
                        { v: 10 },
                        { v: 15 },
                        { v: 12 },
                        { v: 18 },
                        { v: 20 },
                        { v: 17 },
                        { v: 22 },
                      ]; // Mock data for sparkline
                      return (
                        <motion.tr
                          key={`${pos.asset_type}-${pos.asset_id}`}
                          variants={itemVariants}
                          className="border-transparent group"
                        >
                          <TableCell className="py-3">
                            <div className="relative flex items-center gap-3">
                              <div
                                className={cn(
                                  "absolute -left-4 top-1 bottom-1 w-0.5 rounded-full bg-transparent group-hover:bg-opacity-100 opacity-0 group-hover:opacity-100 transition-all",
                                  isPositive ? "bg-green-400" : "bg-red-400"
                                )}
                              ></div>
                              <div
                                className={cn(
                                  "relative w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-300",
                                  isPositive
                                    ? "shadow-[0_0_10px_-3px_rgba(34,197,94,0.7)]"
                                    : "shadow-[0_0_10px_-3px_rgba(239,68,68,0.7)]"
                                )}
                              >
                                {pos.asset_symbol.substring(0, 4)}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-neutral-100">
                                  {pos.asset_name}
                                </p>
                                <p className="text-xs text-neutral-400 font-mono">
                                  {pos.quantity.toLocaleString(undefined, {
                                    maximumFractionDigits: 4,
                                  })}{" "}
                                  shares
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="h-12 w-24">
                            <Sparkline
                              data={mockTrendData}
                              color={trendColor}
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <p className="text-sm font-semibold text-neutral-100">
                              {formatAmount(pos.current_value)}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatAmount(pos.current_price)}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                isPositive ? "text-green-400" : "text-red-400"
                              )}
                            >
                              {isPositive ? "+" : ""}
                              {formatAmount(pos.profit_loss)}
                            </p>
                            <div
                              className={cn(
                                "flex items-center justify-end text-xs",
                                isPositive ? "text-green-500" : "text-red-500"
                              )}
                            >
                              {isPositive ? (
                                <ArrowUp className="h-3 w-3 mr-0.5" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-0.5" />
                              )}
                              {pos.profit_loss_percent}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <button className="h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </Table>
              </div>
            )}
          </StyledTabs>
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

export default PositionsWidget;
