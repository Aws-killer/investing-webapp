"use client";
import React, { useMemo } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { Wallet } from "lucide-react";

const Th = ({ children, right }) => (
  <th className={`px-5 py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary bg-muted ${right ? "text-right" : "text-left"}`}>{children}</th>
);
const Td = ({ children, right, mono, green }) => (
  <td className={`px-5 py-3.5 text-[13px] border-b border-border ${right ? "text-right" : ""} ${mono ? "font-mono font-semibold" : "font-medium"} ${green ? "text-emerald-500" : "text-foreground"}`}>{children}</td>
);

const formatTimeLeft = (maturityDateString) => {
  const now = new Date();
  const maturity = new Date(maturityDateString);
  if (maturity < now) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-[0.08em]">Matured</span>
  );
  const months = (maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const y = Math.floor(months / 12);
  const m = Math.floor(months % 12);
  return `${y > 0 ? `${y}y ` : ""}${m > 0 ? `${m}m` : ""}`.trim() || "< 1m";
};

export const CouponsTable = () => {
  const { positions } = useDashboard();
  const { currencySymbol } = useCurrency();
  const bondPositions = useMemo(() => positions.filter((p) => p.asset_type === "BOND" && (p.total_coupons_received || 0) > 0), [positions]);

  if (!bondPositions.length) return (
    <div className="text-center py-16 text-[13px] text-tertiary font-medium">No coupon-paying bonds found in this portfolio.</div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr><Th>Asset</Th><Th right>Total Invested</Th><Th right>Coupons Received</Th><Th right>Coupon Rate</Th><Th right>Time to Maturity</Th></tr></thead>
        <tbody>
          {bondPositions.map((pos) => (
            <tr key={pos.asset_id} className="hover:bg-background transition-colors">
              <td className="px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-muted flex items-center justify-center text-muted-foreground"><Wallet size={15} /></div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{pos.asset_name}</p>
                    <p className="text-[11px] text-tertiary font-mono">{pos.asset_symbol}</p>
                  </div>
                </div>
              </td>
              <Td right mono>{currencySymbol} {parseFloat(pos.total_invested).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
              <Td right mono green>+{currencySymbol} {parseFloat(pos.total_coupons_received).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
              <Td right mono>{parseFloat(pos.coupon_rate || 0).toFixed(2)}%</Td>
              <Td right mono>{formatTimeLeft(pos.maturity_date)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default CouponsTable;
