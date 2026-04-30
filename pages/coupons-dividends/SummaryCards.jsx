"use client";
import React, { useMemo } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { Landmark, Receipt, TrendingUp, CalendarClock } from "lucide-react";
import { useCurrency } from "@/features/context/currency-context";

const StatCard = ({ icon, label, value, sub }) => (
  <div className="bg-card rounded-[12px] card-shadow p-5 hover:card-shadow-hover transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary">{label}</span>
      <div className="w-7 h-7 rounded-[6px] bg-muted flex items-center justify-center text-muted-foreground">{icon}</div>
    </div>
    <div className="text-[24px] font-extrabold tracking-[-0.04em] text-foreground leading-none">{value}</div>
    {sub && <p className="text-[11px] text-tertiary font-medium mt-1.5">{sub}</p>}
  </div>
);

const SummaryCards = () => {
  const { positions, isLoadingPositions, selectedPortfolio } = useDashboard();
  const { currencySymbol } = useCurrency();
  const summary = useMemo(() => {
    if (!positions?.length) return { totalDividends: 0, totalCoupons: 0, yieldOnCost: 0 };
    let totalDividends = 0, totalCoupons = 0, totalInvested = 0;
    positions.forEach((pos) => {
      if (pos.asset_type === "STOCK") totalDividends += pos.total_dividends_received || 0;
      if (pos.asset_type === "BOND") totalCoupons += pos.total_coupons_received || 0;
      totalInvested += parseFloat(pos.total_invested) || 0;
    });
    return { totalDividends, totalCoupons, yieldOnCost: totalInvested > 0 ? ((totalDividends + totalCoupons) / totalInvested) * 100 : 0 };
  }, [positions]);

  const loading = isLoadingPositions && selectedPortfolio;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={<Landmark size={14} />} label="Lifetime Dividends" value={loading ? "—" : `${currencySymbol} ${summary.totalDividends.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
      <StatCard icon={<Receipt size={14} />} label="Lifetime Coupons" value={loading ? "—" : `${currencySymbol} ${summary.totalCoupons.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
      <StatCard icon={<TrendingUp size={14} />} label="Blended Yield on Cost" value={loading ? "—" : `${summary.yieldOnCost.toFixed(2)}%`} />
      <StatCard icon={<CalendarClock size={14} />} label="Projected Annual Income" value="—" sub="Premium feature coming soon" />
    </div>
  );
};
export { SummaryCards };
export default SummaryCards;
