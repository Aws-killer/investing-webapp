// pages/dashboard/index.jsx
"use client";

import React from "react";
import { withAuth } from "@/components/with-auth";
import { DashboardProvider } from "@/Providers/dashboard";

// Import all the new widget components
import { AIWidget } from "./AIWidget";
import { AllocationWidget } from "./AllocationWidget";
import { Breadcrumbs } from "./Breadcrumbs";
import { CalendarWidget } from "./CalendarWidget";
import { PerformanceWidget } from "./PerformanceWidget";
import { PortfolioSelector } from "./PortfolioSelector";
import { PortfolioWidget } from "./PortfolioWidget";
import { PositionsWidget } from "./PositionsWidget";
import { TransactionsWidget } from "./TransactionsWidget";

// This component lays out the dashboard structure
const DashboardPageInternal = () => {
  return (
    <div className="dark bg-black text-white min-h-screen p-4 md:p-6 font-sans">
      <div className="max-w-screen-xl px-4 sm:px-6 md:px-10 mx-auto">
        <Breadcrumbs />
        <PortfolioSelector />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <PortfolioWidget />
            <PositionsWidget />
            <TransactionsWidget />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <AllocationWidget />
            <CalendarWidget />
            <AIWidget />
            <PerformanceWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

// This component wraps the page with necessary providers
const DashboardPage = () => {
  return (
    <DashboardProvider>
      <DashboardPageInternal />
    </DashboardProvider>
  );
};

// Export the final page, wrapped with authentication
export default withAuth(DashboardPage);
