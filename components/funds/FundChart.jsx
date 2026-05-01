import React from 'react';
import { FinancialChart } from '@/components/ui/FinancialChart';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatTZS } from '@/lib/utils';

export const FundChart = ({
  chartData,
  comparisonDatasets,
  currentValue,
  timeRange,
  onTimeRangeChange,
  isLoading,
  currency = "TZS",
  ComparisonSelector
}) => {
  const timeRanges = ['1D', '1W', '1M', 'YTD', '1Y', 'MAX'];

  return (
    <Card className="p-0 overflow-hidden border border-zinc-800">
      {/* Chart Header */}
      <div className="px-4 md:px-5 py-3 md:py-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div>
          <h3 className="text-xs md:text-sm font-bold text-zinc-100">NAV Chart</h3>
          <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">Net Asset Value performance</p>
        </div>
        {ComparisonSelector}
      </div>

      {/* Chart */}
      <div className="relative h-[300px] sm:h-[350px] md:h-[400px] w-full bg-[#0a0a0a]">
        <FinancialChart
          data={comparisonDatasets.length > 0 ? [] : chartData}
          datasets={comparisonDatasets.length > 0 ? comparisonDatasets : []}
          currentValue={currentValue}
          title="NAV"
          formatter={(val) => `${currency} ${formatTZS(val)}`}
          isLoading={isLoading}
          className="absolute inset-0"
        />
      </div>

      {/* Chart Footer */}
      <div className="px-4 md:px-5 py-3 border-t border-zinc-800/50 bg-[#0a0a0a] flex items-center justify-between flex-wrap gap-3">
        <div className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
          Last Updated: Just now
        </div>
        <div className="flex gap-1 bg-zinc-900/50 backdrop-blur-sm p-1 rounded-lg border border-zinc-800/50">
          {timeRanges.map(range => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={cn(
                "text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded-md transition-all",
                timeRange === range
                  ? "bg-zinc-700 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
