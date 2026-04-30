import React, { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/router';
import { 
  Star, Plus, Search, Bell, Share2, MoreHorizontal,
  ChevronDown, Copy, ArrowUpRight, X, ArrowDownRight,
  TrendingUp, Calendar, Building2, Users, Globe, Wallet
} from 'lucide-react';

import { FinancialChart } from '@/components/ui/FinancialChart';

import {
  useGetStocksQuery,
  useGetStockPricesQuery,
  useGetStockMetricsQuery,
  useGetStockDividendsQuery,
} from '@/features/api/stocksApi';

import {
  useGetFundsQuery,
  useGetFundPricesQuery,
} from '@/features/api/fundsApi';

/* ================================ UTILS ================================== */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatTZS = (value, options = {}) => {
  const { isCompact = false, decimals = 2, currency = '' } = options;
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';

  let formatted;
  if (isCompact) {
    formatted = new Intl.NumberFormat('en-US', {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2
    }).format(num);
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }
  
  return currency ? `${currency} ${formatted}` : formatted;
};

// MATCHES BACKEND: enum=["1D", "1W", "1M", "YTD", "1Y", "Max"]
const TIME_RANGE_MAPPING = {
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
  'YTD': 'YTD',
  '1Y': '1Y',
  'MAX': 'Max'
};

/* ============================== UI COMPONENTS ============================ */
// (Assuming standard Card, Badge, IconButton, TabButton as per your original file)
const Card = ({ children, className = '', padding = 'default' }) => (
    <div className={cn('bg-[#1a1a1a] rounded-xl border border-zinc-800/50', padding === 'lg' ? 'p-6' : 'p-4', className)}>
      {children}
    </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    primary: 'bg-[#8ab4f8]/15 text-[#8ab4f8]',
    success: 'bg-[#81c995]/15 text-[#81c995]',
  };
  return <span className={cn('px-2 py-0.5 rounded text-xs font-medium', variants[variant])}>{children}</span>;
};

/* ========================== STOCK COMPONENTS ============================= */

const PriceDisplay = ({ price, change, percent, isPositive, label, timeLabel, isMain = false }) => (
  <Card className={cn(isMain && 'border-zinc-700/50')}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        <div className={cn("font-semibold tracking-tight", isMain ? "text-3xl text-white" : "text-2xl text-zinc-200")}>
          {price}
        </div>
      </div>
      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium", isPositive ? "bg-[#81c995]/10 text-[#81c995]" : "bg-[#f28b82]/10 text-[#f28b82]")}>
        {isPositive ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
        <span>{Math.abs(percent || 0).toFixed(2)}%</span>
      </div>
    </div>
    <div className="mt-2 flex items-center gap-2">
      <span className={cn("text-sm font-medium", isPositive ? "text-[#81c995]" : "text-[#f28b82]")}>
        {change >= 0 ? "+" : ""}{change?.toFixed(2) || '0.00'}
      </span>
      <span className="text-xs text-zinc-500">{timeLabel}</span>
    </div>
  </Card>
);

/* ============================= MAIN PAGE ================================= */

const StockPage = () => {
  const router = useRouter();
  const { symbol } = router.query;
  const safeSymbol = typeof symbol === 'string' ? symbol.toUpperCase() : null;
  
  const [timeRange, setTimeRange] = useState('1Y'); 
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedComparisons, setSelectedComparisons] = useState([]);

  // --- API HOOKS ---
  const { data: stocks, isLoading: areStocksLoading } = useGetStocksQuery();
  const { data: funds } = useGetFundsQuery();
  
  const backendPeriod = TIME_RANGE_MAPPING[timeRange] || 'Max';

  // Fetch Main Stock Data
  const { data: pricesData, isLoading: isChartLoading } = useGetStockPricesQuery(
    { symbol: safeSymbol, time_range: backendPeriod, limit: 1000 },
    { skip: !safeSymbol }
  );
  
  const { data: metrics } = useGetStockMetricsQuery(safeSymbol, { skip: !safeSymbol });
  const { data: dividends } = useGetStockDividendsQuery(safeSymbol, { skip: !safeSymbol });

  // --- COMPARISON LOGIC ---
  const comp0 = selectedComparisons[0];
  const comp1 = selectedComparisons[1];

  const stockPrices0 = useGetStockPricesQuery({ symbol: comp0?.symbol, time_range: backendPeriod }, { skip: !comp0 || comp0.type !== 'stock' });
  const fundPrices0 = useGetFundPricesQuery({ symbol: comp0?.symbol, period: backendPeriod }, { skip: !comp0 || comp0.type !== 'fund' });
  const stockPrices1 = useGetStockPricesQuery({ symbol: comp1?.symbol, time_range: backendPeriod }, { skip: !comp1 || comp1.type !== 'stock' });
  const fundPrices1 = useGetFundPricesQuery({ symbol: comp1?.symbol, period: backendPeriod }, { skip: !comp1 || comp1.type !== 'fund' });

  // Derive current stock entity from the list
  const stock = useMemo(() => stocks?.find((s) => s.symbol === safeSymbol), [stocks, safeSymbol]);

  // Map to Backend Keys
  const { 
    latest_price = 0, 
    opening_price = 0, 
    market_cap = 0, 
    name, 
    high = 0, 
    low = 0, 
    volume = 0 
  } = stock || {};
  
  const changeValue = latest_price - opening_price;
  const changePercentage = opening_price ? (changeValue / opening_price) * 100 : 0;

  // Process Chart Data: Backend returns newest first, Recharts needs oldest first
  const mainChartData = useMemo(() => {
    if (!pricesData?.prices) return [];
    return [...pricesData.prices]
      .reverse() 
      .map(item => ({
        date: item.date,
        value: Number(item.closing_price) // Backend key is closing_price
      }));
  }, [pricesData]);

  // Comparison Dataset Processor
  const comparisonDatasets = useMemo(() => {
    const datasets = [];
    if (mainChartData.length > 0) {
      datasets.push({ data: mainChartData, name: safeSymbol, color: '#8ab4f8' });
    }

    [ {comp: comp0, s: stockPrices0, f: fundPrices0}, {comp: comp1, s: stockPrices1, f: fundPrices1} ].forEach((slot, idx) => {
      if (!slot.comp) return;
      const rawData = slot.comp.type === 'stock' ? slot.s.data?.prices : slot.f.data?.prices;
      if (rawData) {
        datasets.push({
          data: [...rawData].reverse().map(item => ({
             date: item.date,
             value: Number(item.closing_price || item.nav_per_unit) // Handles both asset types
          })),
          name: slot.comp.symbol,
          color: idx === 0 ? '#c58af9' : '#f28b82'
        });
      }
    });
    return datasets;
  }, [mainChartData, comp0, comp1, stockPrices0, fundPrices0, stockPrices1, fundPrices1, safeSymbol]);

  if (!stock && !areStocksLoading && safeSymbol) return <div className="p-20 text-center text-white">Stock Not Found</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#e8eaed] p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="primary">{safeSymbol}</Badge>
              <span className="text-zinc-500">Dar es Salaam Stock Exchange</span>
            </div>
          </div>
          <div className="flex gap-2">
             <button className="p-2 rounded-full border border-zinc-800"><Star size={20}/></button>
             <button className="p-2 rounded-full border border-zinc-800"><Share2 size={20}/></button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <PriceDisplay 
            isMain={true}
            label="Latest Price"
            price={`TZS ${formatTZS(latest_price)}`}
            change={changeValue}
            percent={changePercentage}
            isPositive={changeValue >= 0}
            timeLabel="DSE Closing Price"
          />
          <PriceDisplay 
            label="Market Cap"
            price={formatTZS(market_cap, { isCompact: true, currency: 'TZS' })}
            change={0}
            percent={0}
            isPositive={true}
            timeLabel="Total Valuation"
          />
        </div>

        {/* Chart Card */}
        <Card padding="lg" className="mb-8">
          <div className="flex justify-between mb-6">
            <div className="flex bg-zinc-900 p-1 rounded-lg">
              {Object.keys(TIME_RANGE_MAPPING).map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn("px-4 py-1.5 text-xs rounded-md transition-all", timeRange === range ? "bg-zinc-700 text-white" : "text-zinc-500")}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px]">
            <FinancialChart 
              data={selectedComparisons.length > 0 ? [] : mainChartData}
              datasets={selectedComparisons.length > 0 ? comparisonDatasets : []}
              isLoading={isChartLoading}
              formatter={(val) => `TZS ${val.toLocaleString()}`}
            />
          </div>
        </Card>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <h3 className="font-bold mb-4">Dividend History</h3>
            <div className="space-y-4">
              {dividends?.map((div, i) => (
                <div key={i} className="flex justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <p className="text-sm font-medium">Payment Date: {div.payment_date}</p>
                    <p className="text-xs text-zinc-500">Ex-Div: {div.ex_dividend_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#81c995]">TZS {div.amount_per_share}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <div className="space-y-4">
            <Card>
              <h3 className="font-bold mb-4">Key Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Volume</span><span>{formatTZS(volume, {isCompact: true})}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">52W High</span><span>{formatTZS(high)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">52W Low</span><span>{formatTZS(low)}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(StockPage);