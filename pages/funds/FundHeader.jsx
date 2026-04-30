import React from 'react';
import { Star, Bell, Share, Plus, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FundHeader = ({ fund, symbol }) => {
  return (
    <header>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-zinc-800 text-xs font-bold text-zinc-400 shrink-0">
            {symbol?.substring(0, 3)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight truncate">
              {fund?.name}
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              {fund?.manager_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors">
            <Star size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
          <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors">
            <Bell size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
          <button className="hidden sm:block p-2 hover:bg-zinc-800 rounded-md transition-colors">
            <Share size={18} />
          </button>
          <button className="flex items-center gap-1.5 md:gap-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs md:text-sm font-semibold px-2.5 md:px-4 py-1.5 md:py-2 rounded-md transition-colors">
            <Plus size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Transaction</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 ml-0 sm:ml-[52px] md:ml-[64px] flex-wrap">
        <span className="bg-[#1a1a1a] text-zinc-400 text-[10px] md:text-[11px] font-semibold px-2 py-0.5 rounded">
          {fund?.fund_type || 'Fund'}
        </span>
        <span className="text-zinc-500 text-[10px] md:text-[11px] flex items-center gap-1 border-l border-zinc-800 pl-2 ml-1">
          Symbol: {symbol} <Copy size={10} className="cursor-pointer hover:text-zinc-300" />
        </span>
        {fund?.currency && (
          <span className="text-zinc-500 text-[10px] md:text-[11px]">
            Currency: {fund.currency}
          </span>
        )}
      </div>
    </header>
  );
};
