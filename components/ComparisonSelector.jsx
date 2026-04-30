import React, { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ComparisonSelector = ({ stocks, funds, selectedComparisons, onAdd, onRemove }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const allAssets = useMemo(() => {
    const stockItems = (stocks || []).map(s => ({ ...s, type: 'stock' }));
    const fundItems = (funds || []).map(f => ({ ...f, type: 'fund' }));
    return [...stockItems, ...fundItems];
  }, [stocks, funds]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return allAssets;
    const term = searchTerm.toLowerCase();
    return allAssets.filter(a => 
      a.symbol?.toLowerCase().includes(term) || 
      a.name?.toLowerCase().includes(term)
    );
  }, [allAssets, searchTerm]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 md:gap-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-xs md:text-sm font-semibold px-2.5 md:px-4 py-1.5 md:py-2 rounded-md transition-colors"
      >
        <Plus size={14} className="md:w-4 md:h-4" /> 
        <span className="hidden sm:inline">Compare</span>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 bg-[#1a1a1a] border border-zinc-800 rounded-lg shadow-xl p-4 max-h-[80vh] overflow-hidden">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stocks or funds..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              autoFocus
            />
            
            <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
              {filteredAssets.slice(0, 10).map(asset => {
                const isSelected = selectedComparisons.some(c => c.symbol === asset.symbol && c.type === asset.type);
                return (
                  <button
                    key={`${asset.type}-${asset.symbol}`}
                    onClick={() => {
                      if (isSelected) {
                        onRemove(asset.symbol, asset.type);
                      } else {
                        onAdd(asset);
                      }
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors text-sm",
                      isSelected 
                        ? "bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30" 
                        : "hover:bg-zinc-800 text-zinc-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{asset.symbol}</div>
                        <div className="text-xs text-zinc-500 truncate">{asset.name}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        {asset.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
