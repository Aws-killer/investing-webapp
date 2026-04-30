import React from 'react';
import { cn } from '@/lib/utils';

export const FundTabs = ({ activeTab = 'overview', onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'performance', label: 'Performance' },
    { id: 'dividends', label: 'Dividends' }
  ];

  return (
    <div className="flex items-center gap-4 md:gap-8 mt-6 md:mt-8 border-b border-zinc-800 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange?.(tab.id)}
          className={cn(
            "text-xs md:text-sm font-medium pb-3 transition-colors whitespace-nowrap",
            activeTab === tab.id
              ? "text-white font-bold border-b-2 border-white"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
