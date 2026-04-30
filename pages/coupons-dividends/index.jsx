"use client";
import React from "react";
import { withAuth } from "@/features/utils/with-auth";
import { DashboardProvider, useDashboard } from "@/features/context/dashboard-context";
import { PortfolioSelector } from "../dashboard/PortfolioSelector";
import { Header } from "./Header";
import { SummaryCards } from "./SummaryCards";
import { DividendsTable } from "./DividendsTable";
import { CouponsTable } from "./CouponsTable";

const TabsContent = () => {
  const [tab, setTab] = React.useState("dividends");
  return (
    <>
      <div className="flex border-b border-border">
        {[{ id: "dividends", label: "Dividends (Stocks)" }, { id: "coupons", label: "Coupons (Bonds)" }].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] transition border-b-2 ${tab === id ? "border-foreground text-foreground" : "border-transparent text-tertiary hover:text-muted-foreground"}`}
          >{label}</button>
        ))}
      </div>
      {tab === "dividends" ? <DividendsTable /> : <CouponsTable />}
    </>
  );
};

const CouponsDividendsPageInternal = () => {
  const { selectedPortfolio } = useDashboard();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl px-4 sm:px-6 md:px-10 mx-auto py-6">
        <Header />
        <PortfolioSelector />
        {selectedPortfolio ? (
          <div className="space-y-5">
            <SummaryCards />
            <div className="bg-card rounded-[12px] card-shadow overflow-hidden"><TabsContent /></div>
          </div>
        ) : (
          <div className="bg-card rounded-[12px] card-shadow flex items-center justify-center h-56">
            <p className="text-[13px] text-tertiary font-medium">Select a portfolio to view your income distribution.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CouponsDividendsPage = () => <DashboardProvider><CouponsDividendsPageInternal /></DashboardProvider>;
export default withAuth(CouponsDividendsPage);
