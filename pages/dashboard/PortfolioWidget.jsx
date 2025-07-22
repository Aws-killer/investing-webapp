// pages/dashboard/PortfolioWidget.jsx
"use client";

import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import { motion, animate, useAnimate, stagger } from "motion/react";
import { useDashboard } from "@/Providers/dashboard";
import { useDeletePortfolioMutation } from "@/features/api/portfoliosApi";
import { useCurrency } from "@/Providers/CurrencyProvider";

// UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePortfolioDialog } from "./Dialogs/CreatePortfolioDialog";

// Charting
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  Tooltip,
  XAxis,
} from "recharts";

// Icons
import {
  Plus,
  Settings,
  ArrowDown,
  ArrowUp,
  Trash,
  LayoutGrid,
} from "lucide-react";
import { GetquinLogo } from "./shared/GetquinLogo";

// --- UTILITY & REUSABLE COMPONENTS ---
const cn = (...classes) => classes.filter(Boolean).join(" ");

const DashboardCard = ({ children, className }) => (
  <div
    className={cn(
      "rounded-xl border border-neutral-800 bg-neutral-900 p-4 md:p-6", // Adjusted padding for mobile
      className
    )}
  >
    {children}
  </div>
);

const TextGenerateEffect = ({ words, className }) => {
  const [scope, animate] = useAnimate();
  useEffect(() => {
    animate(
      "span",
      { opacity: 1, filter: "blur(0px)" },
      { duration: 0.5, delay: stagger(0.05) }
    );
  }, [scope.current, words, animate]);

  return (
    <div className={cn("font-bold", className)}>
      <motion.div ref={scope}>
        {words.split("").map((char, idx) => (
          <motion.span
            key={char + idx}
            className="dark:text-white text-black opacity-0"
            style={{ filter: "blur(10px)" }}
          >
            {char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

// --- PORTFOLIO WIDGET SUB-COMPONENTS ---

const WidgetHeader = ({ title, onAdd, onSettings, onDelete, hasPortfolio }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <LayoutGrid className="h-4 w-4 text-neutral-400" />
      <h3 className="font-sans text-base font-semibold text-neutral-200">
        {title}
      </h3>
    </div>
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        className="bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-700/50 text-neutral-200"
        onClick={onAdd}
      >
        <Plus className="mr-1.5 h-4 w-4" /> Add
      </Button>
      {hasPortfolio && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-neutral-900 border-neutral-800 text-neutral-200"
          >
            <DropdownMenuItem
              onSelect={onSettings}
              className="focus:bg-neutral-800 focus:text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem
              className="text-red-500 focus:bg-red-500/10 focus:text-red-400"
              onSelect={onDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete Portfolio</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label, formatAmount }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-neutral-700 bg-neutral-950/80 p-2 text-xs shadow-lg backdrop-blur-sm">
        <p className="font-bold text-white">{formatAmount(payload[0].value)}</p>
        <p className="text-neutral-400">{label}</p>
      </div>
    );
  }
  return null;
};

// --- MAIN PORTFOLIO WIDGET ---

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
  const [isCreatePortfolioDialogOpen, setIsCreatePortfolioDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePortfolio, { isLoading: isDeletingPortfolio }] =
    useDeletePortfolioMutation();

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio || !userId) return;
    try {
      await deletePortfolio({
        portfolioId: selectedPortfolio.id,
        userId,
      }).unwrap();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete portfolio:", error);
    }
  };

  const handlePortfolioCreated = (newPortfolio) => {
    if (newPortfolio?.id) setSelectedPortfolioId(newPortfolio.id);
  };

  const { currentValue, changeValue, changePercentage, timeseries } =
    performanceData;
  const isInitialLoading =
    isLoadingPortfolios || (isFetchingPerformance && timeseries.length === 0);
  const changeIsPositive = changeValue >= 0;

  if (isInitialLoading && !selectedPortfolio) {
    return (
      <DashboardCard>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-48 mt-4" />
        <Skeleton className="h-6 w-32 mt-2" />
        <Skeleton className="h-48 w-full mt-4" />
      </DashboardCard>
    );
  }

  return (
    <>
      <DashboardCard>
        <WidgetHeader
          title={selectedPortfolio?.name || "Portfolio Overview"}
          hasPortfolio={!!selectedPortfolio}
          onAdd={() => setIsCreatePortfolioDialogOpen(true)}
          onSettings={() => alert("Portfolio settings not implemented.")}
          onDelete={(e) => {
            e.preventDefault();
            setIsDeleteDialogOpen(true);
          }}
        />

        {!selectedPortfolio ? (
          <div className="flex h-64 items-center justify-center text-center text-neutral-500">
            Please select or create a portfolio to see details.
          </div>
        ) : (
          <>
            {/* --- Responsive Layout for Value and Timeframe Toggles --- */}
            <div className="mt-4 flex flex-col md:flex-row md:items-start md:justify-between">
              {/* --- Value and Percentage Change --- */}
              <div className="order-2 md:order-1">
                {isFetchingPerformance ? (
                  <Skeleton className="h-10 w-48" />
                ) : (
                  <TextGenerateEffect
                    words={formatAmount(currentValue)}
                    className="text-3xl md:text-4xl font-mono" // Responsive font size
                  />
                )}
                {isFetchingPerformance ? (
                  <Skeleton className="h-5 w-32 mt-2" />
                ) : (
                  <div
                    className={cn(
                      "flex items-center text-sm",
                      changeIsPositive ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {changeIsPositive ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )}
                    <span className="font-semibold font-mono">
                      {Math.abs(changePercentage).toFixed(2)}%
                    </span>
                    <span className="text-neutral-500 ml-2 font-mono">
                      ({changeIsPositive ? "+" : ""}
                      {formatAmount(changeValue)})
                    </span>
                  </div>
                )}
              </div>
              {/* --- Timeframe Toggles --- */}
              <div className="order-1 md:order-2 mb-4 md:mb-0 self-start md:self-auto">
                <ToggleGroup
                  type="single"
                  value={timeframe}
                  onValueChange={(v) => v && setTimeframe(v)}
                  className="bg-neutral-900/50 border border-neutral-800 p-0.5 rounded-md"
                >
                  {["1D", "1W", "1M", "YTD", "1Y", "Max"].map((t) => (
                    <ToggleGroupItem
                      key={t}
                      value={t}
                      className="text-xs px-2 py-0.5 h-auto data-[state=on]:bg-neutral-700 data-[state=on]:text-white rounded-sm"
                    >
                      {t}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <div className="h-48 w-full mt-4">
              {isFetchingPerformance ? (
                <Skeleton className="h-full w-full" />
              ) : performanceData.isPending ? (
                <div className="flex h-full items-center justify-center text-center text-neutral-500">
                  <div>
                    <p>{performanceData.pendingMessage}</p>
                    <p className="text-xs mt-1">
                      Your chart will appear here shortly.
                    </p>
                  </div>
                </div>
              ) : timeseries.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeseries}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="date" hide />
                    <YAxis domain={["dataMin - 100", "dataMax + 100"]} hide />
                    <Tooltip
                      content={<ChartTooltip formatAmount={formatAmount} />}
                      cursor={{
                        stroke: "hsl(var(--neutral-600))",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={changeIsPositive ? "#22c55e" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-500">
                  Not enough data to display chart.
                </div>
              )}
            </div>

            <div className="flex items-center justify-start text-[10px] text-neutral-600 mt-2">
              <span className="font-bold">CHART BY</span>
              <GetquinLogo className="ml-1.5 h-2.5 text-neutral-400" />
            </div>
          </>
        )}
      </DashboardCard>

      <CreatePortfolioDialog
        isOpen={isCreatePortfolioDialogOpen}
        onOpenChange={setIsCreatePortfolioDialogOpen}
        onPortfolioCreated={handlePortfolioCreated}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-neutral-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-semibold text-white">
                {selectedPortfolio?.name}
              </span>{" "}
              portfolio and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePortfolio}
              disabled={isDeletingPortfolio}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingPortfolio ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};