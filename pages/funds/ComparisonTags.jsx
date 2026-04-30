import React from 'react';
import { X } from 'lucide-react';

export const ComparisonTags = ({ comparisons, onRemove }) => {
  if (comparisons.length === 0) return null;

  return (
    <div className="px-4 md:px-5 py-2.5 md:py-3 border-b border-zinc-800 bg-[#0a0a0a] flex flex-wrap gap-2">
      {comparisons.map(comp => (
        <div
          key={`${comp.type}-${comp.symbol}`}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 md:px-3 py-1"
        >
          <span className="text-xs font-semibold text-zinc-300">{comp.symbol}</span>
          <button
            onClick={() => onRemove(comp.symbol, comp.type)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X size={12} className="md:w-[14px] md:h-[14px]" />
          </button>
        </div>
      ))}
    </div>
  );
};
