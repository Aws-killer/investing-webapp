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
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

// Helper function to calculate time left until maturity
const formatTimeLeft = (maturityDateString) => {
  const now = new Date();
  const maturity = new Date(maturityDateString);
  if (maturity < now) {
    return <Badge variant="destructive">Matured</Badge>;
  }
  const diffInMs = maturity.getTime() - now.getTime();
  const diffInMonths = diffInMs / (1000 * 60 * 60 * 24 * 30.44); // Average days in month

  const years = Math.floor(diffInMonths / 12);
  const months = Math.floor(diffInMonths % 12);

  let result = "";
  if (years > 0) result += `${years}y `;
  if (months > 0) result += `${months}m`;

  return result.trim() || "< 1m";
};

export const CouponsTable = () => {
  const { positions } = useDashboard();

  const bondPositions = useMemo(
    () =>
      positions.filter(
        (p) => p.asset_type === "BOND" && (p.total_coupons_received || 0) > 0
      ),
    [positions]
  );

  if (bondPositions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No coupon-paying bonds found in this portfolio.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Total Invested</TableHead>
          <TableHead className="text-right">Coupons Received</TableHead>
          <TableHead className="text-right">Coupon Rate</TableHead>
          <TableHead className="text-right">Time to Maturity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bondPositions.map((pos) => (
          <TableRow key={pos.asset_id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
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
              +€{parseFloat(pos.total_coupons_received).toFixed(2)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {parseFloat(pos.coupon_rate || 0).toFixed(2)}%
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatTimeLeft(pos.maturity_date)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
