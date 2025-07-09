// pages/dashboard/AllocationWidget.jsx
"use client";

import React from "react";
import { useDashboard } from "@/Providers/dashboard";
import { PremiumBadge } from "./shared/PremiumBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChevronRight } from "lucide-react";

export const AllocationWidget = () => {
  const {
    allocation,
    totalPortfolioValue,
    isLoadingTransactions,
    selectedPortfolio,
  } = useDashboard();

  if (isLoadingTransactions && selectedPortfolio) {
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
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <CardTitle>Allocation</CardTitle>
          <PremiumBadge />
        </div>
        <Button variant="link" className="text-muted-foreground pr-0">
          Show more
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="type">
          <div className="relative">
            <TabsList className="w-full justify-start overflow-x-auto p-0 h-auto bg-transparent border-b rounded-none">
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="deepdive">DeepDive</TabsTrigger>
              <TabsTrigger value="regions">Regions</TabsTrigger>
              <TabsTrigger value="sectors">Sectors</TabsTrigger>
            </TabsList>
            <div className="absolute right-0 top-0 h-full flex items-center bg-gradient-to-l from-card via-card to-transparent pl-8">
              <Button
                variant="ghost"
                size="icon"
                className="h-full rounded-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Tabs>
        <div className="h-64 w-full mt-8 relative">
          {allocation && allocation.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={450}
                  >
                    {allocation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="hsl(var(--card))"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${parseFloat(props.payload.value).toFixed(
                        2
                      )}% (€${parseFloat(props.payload.absoluteValue).toFixed(
                        2
                      )})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-muted-foreground font-semibold">
                  Total Value
                </p>
                <p className="text-2xl font-bold font-mono">
                  €{totalPortfolioValue.toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No allocation data to display for this portfolio.</p>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {allocation.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-mono">
                {item.value.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
