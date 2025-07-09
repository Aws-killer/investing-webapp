// pages/dashboard/PositionsWidget.jsx
"use client";

import React, { useState } from "react";
import { useDashboard } from "@/Providers/dashboard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp,
  MoreVertical,
} from "lucide-react";
import { AddTransactionDialog } from "./Dialogs/AddTransactionDialog";

export const PositionsWidget = () => {
  const {
    positions,
    isLoadingPositions,
    selectedPortfolio,
    selectedPortfolioId,
  } = useDashboard();
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] =
    useState(false);

  if (isLoadingPositions && selectedPortfolio) {
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

  if (!selectedPortfolio) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Positions</CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAddTransactionDialogOpen(true)}
            disabled={!selectedPortfolioId}
          >
            <Plus className="mr-2 h-4 w-4" /> Add transaction
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alltime">
            <TabsList>
              <TabsTrigger value="alltime">Alltime</TabsTrigger>
              <TabsTrigger value="intraday" disabled>
                Intraday
              </TabsTrigger>
            </TabsList>
            <TabsContent value="alltime" className="mt-4">
              {positions.length === 0 && !isLoadingPositions && (
                <p className="text-center text-muted-foreground py-4">
                  No positions to display for this portfolio. Add a transaction
                  to get started.
                </p>
              )}
              {positions.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">
                        <div className="flex items-center">
                          Title <ChevronDown className="h-4 w-4 ml-1" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end">
                          Avg. Buy In <ChevronDown className="h-4 w-4 ml-1" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right text-primary">
                        <div className="flex items-center justify-end">
                          Position Value <ChevronUp className="h-4 w-4 ml-1" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end">
                          P/L <ChevronDown className="h-4 w-4 ml-1" />
                        </div>
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow
                        key={`${position.asset_type}-${position.asset_id}`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
                              {position.asset_symbol.substring(0, 4)}
                            </div>
                            <div>
                              <p className="font-bold">{position.asset_name}</p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {position.asset_symbol} x{" "}
                                {position.quantity.toLocaleString(undefined, {
                                  maximumFractionDigits: 4,
                                })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <p>€{position.total_invested}</p>
                          <p className="text-sm text-muted-foreground">
                            €{position.avg_buy_price}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <p>€{position.current_value}</p>
                          <p className="text-sm text-muted-foreground">
                            €{position.current_price}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <p
                            className={
                              position.profit_loss >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {position.profit_loss >= 0 ? "+" : ""}€
                            {position.profit_loss}
                          </p>
                          <div
                            className={`flex items-center justify-end text-sm ${
                              position.profit_loss >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {position.profit_loss >= 0 ? (
                              <ArrowUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDown className="h-3 w-3 mr-1" />
                            )}
                            {position.profit_loss_percent}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
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
