// pages/dashboard/PerformanceWidget.jsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PerformanceWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Performance metrics coming soon.
        </p>
      </CardContent>
    </Card>
  );
};
