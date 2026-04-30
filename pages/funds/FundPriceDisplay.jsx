import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTZS } from '@/lib/utils';

export const FundPriceDisplay = ({ fund, currency = "TZS" }) => {
  const latestNav = fund?.latest_nav || 0;
  const returnYTD = fund?.return_ytd || 0;
  const isPositive = returnYTD >= 0;

  return (
    <div className="mt-4 md:mt-6 flex flex-wrap items-baseline gap-2">
      <span className="text-zinc-400 text-xs md:text-sm font-bold">{currency}</span>
      <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">
        {formatTZS(latestNav)}
      </span>
      <span className={cn(
        "text-base md:text-lg font-medium flex items-center gap-1",
        isPositive ? "text-emerald-500" : "text-red-500"
      )}>
        {isPositive ? (
          <ArrowUpRight size={16} className="md:w-5 md:h-5" />
        ) : (
          <ArrowUpRight className="rotate-90" size={16} />
        )}
        {returnYTD > 0 && '+'}{returnYTD?.toFixed(2)}% YTD
      </span>
    </div>
  );
};
