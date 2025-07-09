// pages/dashboard/CalendarWidget.jsx
"use client";

import React from "react";
import { useDashboard } from "@/Providers/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CalendarWidget = () => {
  const { calendarEvents, isLoadingCalendar, selectedPortfolio } =
    useDashboard();

  if (!selectedPortfolio) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingCalendar && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoadingCalendar && calendarEvents.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No upcoming dividend or coupon events in the next 90 days.
          </p>
        )}
        {!isLoadingCalendar && calendarEvents.length > 0 && (
          <div className="space-y-3">
            {calendarEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted/50"
              >
                <div className="flex flex-col items-center w-16 text-center">
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString(undefined, {
                      month: "short",
                    })}
                  </span>
                  <span className="text-lg font-bold">
                    {new Date(event.event_date).getDate()}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-sm">
                    {event.asset_name} ({event.asset_symbol})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.event_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-green-500">
                    +€{parseFloat(event.estimated_amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
