// pages/dashboard/PortfolioWidget.jsx
"use client";

import React, { useState } from "react";
import { useDashboard } from "@/Providers/dashboard";

import { GetquinLogo } from "./shared/GetquinLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
// highlight-start
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
// highlight-end
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  Tooltip,
  XAxis,
} from "recharts";
// highlight-start
import { Plus, Settings, ArrowDown, ArrowUp, Trash } from "lucide-react";
// highlight-end
import { CreatePortfolioDialog } from "./Dialogs/CreatePortfolioDialog";
import { useDeletePortfolioMutation } from "@/features/api/portfoliosApi";

export const PortfolioWidget = () => {
  const {
    userId: user, // Assuming user is provided by the dashboard context
    selectedPortfolio,
    isLoadingPortfolios,
    isFetchingPerformance,
    performanceData,
    timeframe,
    setTimeframe,
    setSelectedPortfolioId,
  } = useDashboard();

  const [isCreatePortfolioDialogOpen, setIsCreatePortfolioDialogOpen] =
    useState(false);
  // highlight-start
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [deletePortfolio, { isLoading: isDeletingPortfolio }] =
    useDeletePortfolioMutation();

  const handleDeletePortfolio = async () => {
    console.log("Deleting portfolio:", selectedPortfolio, "for user:", user);
    if (!selectedPortfolio || !user) return;

    // Call the delete
    try {
      await deletePortfolio({
        portfolioId: selectedPortfolio.id,
        userId: user,
      }).unwrap();
      // After successful deletion, RTK Query refetches the portfolio list.
      // The useDashboard provider will notice the selected ID is gone and should clear it.
      // This will cause the component to re-render, showing the "select a portfolio" message.
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete portfolio:", error);
      // Optionally, show an error toast to the user
    }
  };
  // highlight-end

  const currentValue = performanceData.currentValue;
  const change = performanceData.changeValue;
  const changePercent = performanceData.changePercentage;
  const chartData = performanceData.timeseries;

  const isLoading =
    isLoadingPortfolios || (isFetchingPerformance && chartData.length === 0);
  if (isLoading && !selectedPortfolio) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handlePortfolioCreated = (newPortfolio) => {
    if (newPortfolio && newPortfolio.id) {
      setSelectedPortfolioId(newPortfolio.id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {selectedPortfolio?.name || "Portfolio Overview"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => setIsCreatePortfolioDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add account
            </Button>
            {/*// highlight-start*/}
            {selectedPortfolio && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() =>
                      alert("Portfolio settings not implemented.")
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-red-50 focus:text-red-600"
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete Portfolio</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/*// highlight-end*/}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedPortfolio && !isLoadingPortfolios && (
            <p className="text-muted-foreground">
              Please select a portfolio to see details.
            </p>
          )}
          {selectedPortfolio && (
            <>
              <div className="mt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-4xl font-mono font-bold mt-2">
                      {isLoading ? (
                        <Skeleton className="h-10 w-48" />
                      ) : (
                        `€${currentValue.toFixed(2)}`
                      )}
                    </p>
                    {!isLoading && currentValue > 0 && (
                      <div
                        className={`flex items-center mt-1 ${
                          change >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {change >= 0 ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                        <span className="font-semibold font-mono">
                          {Math.abs(changePercent).toFixed(2)}%
                        </span>
                        <span className="text-muted-foreground ml-2 font-mono">
                          ({change >= 0 ? "+" : ""}€{change.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <ToggleGroup
                      type="single"
                      value={timeframe}
                      onValueChange={(val) => val && setTimeframe(val)}
                      className="mt-12 bg-transparent"
                    >
                      <ToggleGroupItem value="1D">1D</ToggleGroupItem>
                      <ToggleGroupItem value="1W">1W</ToggleGroupItem>
                      <ToggleGroupItem value="1M">1M</ToggleGroupItem>
                      <ToggleGroupItem value="YTD">YTD</ToggleGroupItem>
                      <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
                      <ToggleGroupItem value="Max">Max</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
                <div className="h-64 w-full mt-4 -ml-6">
                  {isLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : performanceData.isPending ? (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                      <div>
                        <p>{performanceData.pendingMessage}</p>
                        <p className="text-sm mt-2">
                          Your chart will appear here shortly.
                        </p>
                      </div>
                    </div>
                  ) : chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <XAxis dataKey="date" hide />
                        <YAxis
                          domain={["dataMin - 100", "dataMax + 100"]}
                          hide
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                          labelStyle={{ fontWeight: "bold" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={change >= 0 ? "#10B981" : "#EF4444"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Not enough data to display chart for this period.</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-start text-xs text-muted-foreground mt-2 -ml-4">
                  <span className="font-bold">CHART BY</span>{" "}
                  <GetquinLogo className="ml-2 h-3 text-card-foreground" />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <CreatePortfolioDialog
        isOpen={isCreatePortfolioDialogOpen}
        onOpenChange={setIsCreatePortfolioDialogOpen}
        onPortfolioCreated={handlePortfolioCreated}
      />
      {/*// highlight-start*/}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              <span className="font-semibold"> {selectedPortfolio?.name} </span>
              portfolio and all of its associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
      {/*// highlight-end*/}
    </>
  );
};
