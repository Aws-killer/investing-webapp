// components/GlobalSearch.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Search, TrendingUp, PieChart, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetStocksQuery } from '@/features/api/stocksApi';
import { useGetFundsQuery } from '@/features/api/fundsApi';
import { getStockLogoUrl } from '@/lib/stockLogos';

const cn = (...classes) => classes.filter(Boolean).join(" ");

const ResultAvatar = ({ result }) => {
  const [failed, setFailed] = useState(false);
  const logoUrl = result.type === 'stock' ? getStockLogoUrl(result.symbol, result.logo_url) : null;

  if (logoUrl && !failed) {
    return (
      <div className="h-8 w-8 rounded-lg bg-white border border-border/70 flex items-center justify-center shrink-0 overflow-hidden">
        <img
          src={logoUrl}
          alt={`${result.symbol} logo`}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
      result.type === 'stock' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
    )}>
      {result.type === 'stock' ? <TrendingUp size={16} /> : <PieChart size={16} />}
    </div>
  );
};

export const GlobalSearch = ({ className, placeholder = "Search stocks, funds...", onNavigate }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fetch Data
  const { data: stocks, isLoading: stocksLoading } = useGetStocksQuery();
  const { data: funds, isLoading: fundsLoading } = useGetFundsQuery();

  // Combine and Filter Data
  const filteredResults = useMemo(() => {
    if (!query) return [];
    
    const searchTerm = query.toLowerCase();
    
    const stockResults = (stocks || []).map(s => ({
      ...s,
      type: 'stock',
      url: `/stocks/${s.symbol}`
    })).filter(s => 
      s.symbol.toLowerCase().includes(searchTerm) || 
      s.name.toLowerCase().includes(searchTerm)
    );

    const fundResults = (funds || []).map(f => ({
      ...f,
      type: 'fund',
      symbol: f.name, // funds have no ticker symbol; use name as the display identifier
      url: `/funds/${f.id}`
    })).filter(f =>
      f.name.toLowerCase().includes(searchTerm) ||
      (f.manager_name || '').toLowerCase().includes(searchTerm)
    );

    // Interleave results or sort by relevance (simple sort by symbol match here)
    return [...stockResults, ...fundResults].slice(0, 8); // Limit to 8 results
  }, [query, stocks, funds]);

  // Handle Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result) => {
    setQuery('');
    setIsOpen(false);
    router.push(result.url);
    if (onNavigate) onNavigate();
  };

  const isLoading = stocksLoading || fundsLoading;

  return (
    <div className={cn("relative group w-full", className)} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-muted/50 border border-transparent focus:border-border rounded-md py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none transition-all placeholder:text-muted-foreground focus:bg-muted"
        />
        {isLoading && query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50"
          >
            {filteredResults.length > 0 ? (
              <div className="py-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Results
                </div>
                {filteredResults.map((result) => (
                  <button
                    key={`${result.type}-${result.symbol}`}
                    onClick={() => handleSelect(result)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-zinc-800/80 transition-colors group/item text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ResultAvatar result={result} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-200">{result.symbol}</span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium border",
                            result.type === 'stock' 
                              ? "border-blue-500/20 text-blue-400/80" 
                              : "border-purple-500/20 text-purple-400/80"
                          )}>
                            {result.type === 'stock' ? 'STOCK' : 'FUND'}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-xs">
                          {result.name}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                No results found for "{query}"
              </div>
            )}
            
            <div className="px-3 py-2 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500">
              <span>Search equities & mutual funds</span>
              <span>DSE Market Data</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
