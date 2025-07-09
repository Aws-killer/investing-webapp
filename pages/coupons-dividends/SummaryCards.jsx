"use client";

import React, { useMemo } from "react";
import { useDashboard } from "@/Providers/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Receipt, TrendingUp, CalendarClock } from "lucide-react";

export const SummaryCards = () => {
  const { positions, isLoadingPositions, selectedPortfolio } = useDashboard();

  const summary = useMemo(() => {
    if (!positions || positions.length === 0) {
      return { totalDividends: 0, totalCoupons: 0, totalInvested: 0 };
    }
    let totalDividends = 0;
    let totalCoupons = 0;
    let totalInvested = 0;

    positions.forEach((pos) => {
      if (pos.asset_type === "STOCK") {
        totalDividends += pos.total_dividends_received || 0;
      }
      if (pos.asset_type === "BOND") {
        totalCoupons += pos.total_coupons_received || 0;
      }
      totalInvested += parseFloat(pos.total_invested) || 0;
    });

    const yieldOnCost =
      totalInvested > 0
        ? ((totalDividends + totalCoupons) / totalInvested) * 100
        : 0;

    return { totalDividends, totalCoupons, yieldOnCost };
  }, [positions]);

  const isLoading = isLoadingPositions && selectedPortfolio;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Lifetime Dividends
          </CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">
              €{summary.totalDividends.toFixed(2)}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Lifetime Coupons
          </CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">
              €{summary.totalCoupons.toFixed(2)}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Blended Yield on Cost
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">
              {summary.yieldOnCost.toFixed(2)}%
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Projected Annual Income
          </CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">€...</div>
          )}
          <p className="text-xs text-muted-foreground">
            Premium feature coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
