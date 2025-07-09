"use client";

import React, { useMemo } from "react";
import { useDashboard } from "@/Providers/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";

export const DividendsTable = () => {
  const { positions } = useDashboard();

  const stockPositions = useMemo(
    () =>
      positions.filter(
        (p) => p.asset_type === "STOCK" && (p.total_dividends_received || 0) > 0
      ),
    [positions]
  );

  if (stockPositions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No dividend-paying stocks found in this portfolio.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Total Invested</TableHead>
          <TableHead className="text-right">Dividends Received</TableHead>
          <TableHead className="text-right">Yield on Cost</TableHead>
          <TableHead className="text-right">Annual Rate / Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stockPositions.map((pos) => {
          const yieldOnCost =
            pos.total_invested > 0
              ? (
                  (pos.total_dividends_received / pos.total_invested) *
                  100
                ).toFixed(2)
              : "0.00";
          return (
            <TableRow key={pos.asset_id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{pos.asset_name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {pos.asset_symbol}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                €{parseFloat(pos.total_invested).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono text-green-400">
                +€{parseFloat(pos.total_dividends_received).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {yieldOnCost}%
              </TableCell>
              <TableCell className="text-right font-mono">
                €{parseFloat(pos.annual_dividend_rate || 0).toFixed(2)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
