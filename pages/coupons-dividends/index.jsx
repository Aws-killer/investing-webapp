"use client";

import React from "react";
import { withAuth } from "@/components/with-auth";
import { DashboardProvider, useDashboard } from "@/Providers/dashboard";
import { PortfolioSelector } from "../dashboard/PortfolioSelector";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Header } from "./Header";
import { SummaryCards } from "./SummaryCards";
import { DividendsTable } from "./DividendsTable";
import { CouponsTable } from "./CouponsTable";

const CouponsDividendsPageInternal = () => {
  const { selectedPortfolio } = useDashboard();
  return (
    <div className="dark bg-black text-white min-h-screen p-4 md:p-6 font-sans">
      <div className="max-w-screen-xl mx-auto">
        <Header />
        <PortfolioSelector />

        {selectedPortfolio ? (
          <>
            <SummaryCards />
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="dividends">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dividends">
                      Dividends (Stocks)
                    </TabsTrigger>
                    <TabsTrigger value="coupons">Coupons (Bonds)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="dividends" className="mt-4">
                    <DividendsTable />
                  </TabsContent>
                  <TabsContent value="coupons" className="mt-4">
                    <CouponsTable />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">
              Please select a portfolio to view its income details.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

const CouponsDividendsPage = () => {
  return (
    <DashboardProvider>
      <CouponsDividendsPageInternal />
    </DashboardProvider>
  );
};

export default withAuth(CouponsDividendsPage);
