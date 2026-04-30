"use client";
import React, { useMemo } from "react";
import { useDashboard } from "@/features/context/dashboard-context";
import { useCurrency } from "@/features/context/currency-context";
import { Building2 } from "lucide-react";

const Th = ({ children, right }) => (
  <th className={`px-5 py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary bg-muted ${right ? "text-right" : "text-left"}`}>{children}</th>
);
const Td = ({ children, right, mono, green }) => (
  <td className={`px-5 py-3.5 text-[13px] border-b border-border ${right ? "text-right" : ""} ${mono ? "font-mono font-semibold" : "font-medium"} ${green ? "text-emerald-500" : "text-foreground"}`}>{children}</td>
);

export const DividendsTable = () => {
  const { positions } = useDashboard();
  const { currencySymbol } = useCurrency();
  const stockPositions = useMemo(() => positions.filter((p) => p.asset_type === "STOCK" && (p.total_dividends_received || 0) > 0), [positions]);

  if (!stockPositions.length) return (
    <div className="text-center py-16 text-[13px] text-tertiary font-medium">No dividend-paying stocks found in this portfolio.</div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr><Th>Asset</Th><Th right>Total Invested</Th><Th right>Dividends Received</Th><Th right>Yield on Cost</Th><Th right>Annual Rate / Share</Th></tr></thead>
        <tbody>
          {stockPositions.map((pos) => {
            const yoc = pos.total_invested > 0 ? ((pos.total_dividends_received / pos.total_invested) * 100).toFixed(2) : "0.00";
            return (
              <tr key={pos.asset_id} className="hover:bg-background transition-colors">
                <td className="px-5 py-3.5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-muted flex items-center justify-center text-muted-foreground"><Building2 size={15} /></div>
                    <div>
                      <p className="text-[13px] font-bold text-foreground">{pos.asset_name}</p>
                      <p className="text-[11px] text-tertiary font-mono">{pos.asset_symbol}</p>
                    </div>
                  </div>
                </td>
                <Td right mono>{currencySymbol} {parseFloat(pos.total_invested).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
                <Td right mono green>+{currencySymbol} {parseFloat(pos.total_dividends_received).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
                <Td right mono>{yoc}%</Td>
                <Td right mono>{currencySymbol} {parseFloat(pos.annual_dividend_rate || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default DividendsTable;
