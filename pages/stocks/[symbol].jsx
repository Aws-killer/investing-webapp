import React, { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/router';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { 
  Star, 
  Plus, 
  Search,
  Bell,
  Share,
  PenLine,
  MessageSquare,
  TrendingUp,
  User,
  ChevronDown,
  Copy,
  ArrowUpRight
} from 'lucide-react';

// --- MOCK HOOKS (Replace with your actual imports) ---
import {
  useGetStocksQuery,
  useGetStockPricesQuery,
  useGetStockMetricsQuery,
  useGetStockDividendsQuery,
} from '@/features/api/stocksApi';

/* -------------------------------- UTILS ---------------------------------- */
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Specialized formatter for TZS (Tanzanian Shilling)
const formatTZS = (value, options = {}) => {
  const { 
    isCompact = false, 
    decimals = 2 
  } = options;

  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';

  if (isCompact) {
    return new Intl.NumberFormat('en-TZ', {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2
    }).format(num);
  }

  return new Intl.NumberFormat('en-TZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

/* ---------------------------- COMPONENTS --------------------------------- */

// 1. Global Navigation Bar
const Navbar = () => (
  <nav className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-zinc-800 h-14 flex items-center justify-between px-4 lg:px-6">
    {/* Logo Area */}
    <div className="flex items-center gap-6">
      <div className="font-bold text-lg text-zinc-200 tracking-tight">getquin</div>
    </div>

    {/* Search Bar - Centered */}
    <div className="hidden md:flex flex-1 max-w-xl mx-6">
      <div className="relative w-full group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search for stocks, etfs or profiles" 
          className="w-full bg-[#1a1a1a] border border-transparent focus:border-zinc-700 rounded-md py-1.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none transition-all placeholder:text-zinc-600"
        />
      </div>
    </div>

    {/* Right Actions */}
    <div className="flex items-center gap-3 text-zinc-400">
      <button className="p-2 hover:text-white transition-colors"><TrendingUp size={18} /></button>
      <button className="p-2 hover:text-white transition-colors"><PenLine size={18} /></button>
      <button className="p-2 hover:text-white transition-colors"><MessageSquare size={18} /></button>
      <button className="p-2 hover:text-white transition-colors"><Star size={18} /></button>
      <button className="p-2 hover:text-white transition-colors"><Bell size={18} /></button>
      
      <button className="ml-2 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-black border border-zinc-400"></span> Upgrade
      </button>
      
      <button className="ml-2 p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors">
        <User size={20} className="text-zinc-400" />
      </button>
    </div>
  </nav>
);

// 2. Card Container (The dark boxes)
const Card = ({ children, className, title, action }) => (
  <div className={cn("bg-[#121212] rounded-lg border border-zinc-800/50 p-5", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="text-sm font-bold text-zinc-100">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

// 3. FAQ Accordion Item
const FAQItem = ({ question }) => (
  <div className="flex items-center justify-between py-4 border-b border-zinc-800 cursor-pointer group">
    <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{question}</span>
    <ChevronDown size={16} className="text-zinc-500" />
  </div>
);

// 4. 52 Week Range Bar
const RangeBar = ({ low, high, current, currency }) => {
  // Avoid division by zero
  const percent = high - low === 0 ? 0 : ((current - low) / (high - low)) * 100;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-zinc-400 mb-2 font-semibold">
        <span>52W span</span>
        <span>{currency} {formatTZS(high)}</span>
      </div>
      <div className="relative h-1 w-full bg-zinc-800 rounded-full">
        <div 
          className="absolute h-1 bg-zinc-500 rounded-full" 
          style={{ width: `${clampedPercent}%` }} 
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#121212]"
          style={{ left: `${clampedPercent}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-100 font-bold mt-2">
        <span>{currency} {formatTZS(low)}</span>
      </div>
    </div>
  );
};

// 5. Analyst Rating Bar
const RatingRow = ({ label, value, total }) => (
  <div className="flex items-center gap-4 text-xs py-2">
    <span className="w-8 font-semibold text-zinc-400">{label}</span>
    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div 
        className="h-full bg-white rounded-full" 
        style={{ width: `${(value/total)*100}%` }} 
      />
    </div>
    <span className="w-4 text-right font-bold text-zinc-200">{value}</span>
  </div>
);

/* ---------------------------- MAIN PAGE ---------------------------------- */

const StockPage = () => {
  const router = useRouter();
  const { symbol } = router.query;
  const [timeRange, setTimeRange] = useState('1Y');

  // --- API HOOKS ---
  const { data: stocks, isLoading: areStocksLoading } = useGetStocksQuery();
  const { data: pricesData } = useGetStockPricesQuery(
    { symbol, time_range: timeRange.toLowerCase(), page_size: 365 },
    { skip: !symbol }
  );
  const { data: metrics } = useGetStockMetricsQuery(symbol, { skip: !symbol });

  const stock = useMemo(() => stocks?.find((s) => s.symbol === symbol?.toUpperCase()), [stocks, symbol]);

  if (!stock && !areStocksLoading) return <div className="bg-black min-h-screen text-white p-10">Loading...</div>;

  // Calculations
  const { latest_price = 0, opening_price = 0, market_cap = 0, name, high = 0, low = 0 } = stock || {};
  const changeValue = latest_price - opening_price;
  const changePercentage = opening_price ? (changeValue / opening_price) * 100 : 0;
  const isPositive = changeValue >= 0;
  const chartData = pricesData?.prices ? [...pricesData.prices].reverse() : [];
  
  // Currency Display
  const CURRENCY = "TZS";

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-emerald-900 selection:text-white">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 space-y-6">
        
        {/* --- Breadcrumbs --- */}
        <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="hover:text-zinc-300 cursor-pointer">Markets</span>
            <span>&gt;</span>
            <span className="hover:text-zinc-300 cursor-pointer">Stocks</span>
            <span>&gt;</span>
            <span className="text-zinc-200 font-medium">{name}</span>
        </div>

        {/* --- Header Section --- */}
        <header>
            {/* Title Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-zinc-800 text-xs font-bold text-zinc-400">
                        {symbol?.substring(0,3)}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors"><Star size={18}/></button>
                    <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors"><Bell size={18}/></button>
                    <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors"><Share size={18}/></button>
                    <button className="flex items-center gap-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold px-4 py-2 rounded-md transition-colors ml-2">
                        <Plus size={16} /> Transaction
                    </button>
                </div>
            </div>

            {/* Badges Row */}
            <div className="flex items-center gap-2 mt-3 ml-[64px]">
                <span className="bg-[#1a1a1a] text-zinc-400 text-[11px] font-semibold px-2 py-0.5 rounded">Stock</span>
                {metrics?.isin && (
                    <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                        ISIN: {metrics.isin} <Copy size={10} className="cursor-pointer hover:text-zinc-300"/>
                    </span>
                )}
                 <span className="text-zinc-500 text-[11px] flex items-center gap-1 border-l border-zinc-800 pl-2 ml-1">
                        Ticker: {symbol} <Copy size={10} className="cursor-pointer hover:text-zinc-300"/>
                </span>
            </div>

            {/* Price Row */}
            <div className="mt-6 flex items-baseline gap-2">
                <span className="text-zinc-400 text-sm font-bold">{CURRENCY}</span>
                <span className="text-4xl font-bold text-white tracking-tight">{formatTZS(latest_price)}</span>
                <span className={cn("text-lg font-medium ml-2 flex items-center gap-1", isPositive ? "text-emerald-500" : "text-red-500")}>
                    {isPositive ? <ArrowUpRight size={20} /> : <ArrowUpRight className="rotate-90" size={20} />} 
                    {CURRENCY} {formatTZS(Math.abs(changeValue))} ({changePercentage.toFixed(2)}%)
                </span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 mt-8 border-b border-zinc-800">
                <button className="text-sm font-bold text-white border-b-2 border-white pb-3">Overview</button>
                <button className="text-sm font-medium text-zinc-400 hover:text-zinc-200 pb-3 transition-colors">Portfolio</button>
                <button className="text-sm font-medium text-zinc-400 hover:text-zinc-200 pb-3 transition-colors">Discussion</button>
            </div>
        </header>

        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
            {/* LEFT COLUMN (2/3) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Main Price Chart */}
                <Card className="min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                           <h3 className="text-xs font-bold text-zinc-400 mb-1">Price</h3>
                           <div className="flex items-baseline gap-1">
                               <span className="text-xs text-zinc-500">{CURRENCY}</span>
                               <span className="text-2xl font-bold text-white">{formatTZS(latest_price)}</span>
                           </div>
                           <div className={cn("text-xs font-medium flex items-center gap-1 mt-1", isPositive ? "text-emerald-500" : "text-red-500")}>
                                <ArrowUpRight size={12} /> {CURRENCY} {formatTZS(Math.abs(changeValue))} ({changePercentage.toFixed(2)}%)
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                             <button className="text-xs font-bold text-zinc-300 flex items-center gap-1 hover:text-white transition-colors">
                                <Plus size={14} /> Add benchmark
                             </button>
                        </div>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="flex-1 relative w-full h-[300px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '4px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}
                                    formatter={(value) => [`${formatTZS(value)} ${CURRENCY}`, 'Price']}
                                />
                                <XAxis dataKey="date" hide />
                                <YAxis domain={['auto', 'auto']} hide />
                                <CartesianGrid vertical={false} horizontal={true} stroke="#222" strokeDasharray="3 3" />
                                <Area 
                                    type="monotone" 
                                    dataKey="closing_price" 
                                    stroke={isPositive ? "#10b981" : "#ef4444"} 
                                    strokeWidth={2}
                                    fill="url(#colorPrice)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>

                        {/* Time Range Selectors - Absolute positioned or flex at bottom */}
                        <div className="flex justify-end gap-1 mt-2">
                            {['1D', '1W', '1M', 'YTD', '1Y', 'MAX'].map(range => (
                                <button 
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={cn(
                                        "text-[11px] font-bold px-3 py-1 rounded-md transition-colors",
                                        timeRange === range 
                                            ? "bg-[#2a2a2a] text-white" 
                                            : "text-zinc-500 hover:bg-[#1a1a1a] hover:text-zinc-300"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                        Chart by <span className="text-zinc-500">getquin</span>
                    </div>
                </Card>

                {/* 2. FAQ Section */}
                <div>
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">Frequently asked questions</h3>
                    <div className="bg-transparent">
                        <FAQItem question={`What is ${name}'s market capitalization?`} />
                        <FAQItem question={`What is ${name}'s Price-to-Earnings (P/E) ratio?`} />
                        <FAQItem question={`What is the Earnings Per Share (EPS) for ${name}?`} />
                        <FAQItem question={`What are the analyst ratings for ${name}?`} />
                    </div>
                </div>

            </div>


            {/* RIGHT COLUMN (1/3) */}
            <div className="lg:col-span-1 space-y-4">
                
                {/* 1. Financials Card */}
                <Card title="Financials">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                            <div className="text-xs text-zinc-400 font-medium mb-1">Market Cap</div>
                            <div className="text-sm font-bold text-white">{CURRENCY} {formatTZS(market_cap, { isCompact: true })}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium mb-1 flex items-center gap-1">EPS (TTM) <span className="text-zinc-600">ⓘ</span></div>
                            <div className="text-sm font-bold text-white">{CURRENCY} {formatTZS(metrics?.eps)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium mb-1 flex items-center gap-1">Free Float <span className="text-zinc-600">ⓘ</span></div>
                            <div className="text-sm font-bold text-white">{stock?.volume ? formatTZS(stock.volume, { isCompact: true }) : '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium mb-1 flex items-center gap-1">P/E ratio (TTM) <span className="text-zinc-600">ⓘ</span></div>
                            <div className="text-sm font-bold text-white">{metrics?.pe_ratio ? Number(metrics.pe_ratio).toFixed(2) : '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium mb-1 flex items-center gap-1">Revenue (TTM)</div>
                            <div className="text-sm font-bold text-white">{CURRENCY} {formatTZS(metrics?.revenue || 0, { isCompact: true })}</div>
                        </div>
                    </div>
                </Card>

                {/* 2. Pricing Card */}
                <Card title="Pricing">
                    <RangeBar 
                        low={low || 0} 
                        high={high || 0} 
                        current={latest_price} 
                        currency={CURRENCY} 
                    />
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-800">
                        <div>
                            <div className="text-xs text-zinc-400 font-medium mb-1">Open</div>
                            <div className="text-sm font-bold text-white">{CURRENCY} {formatTZS(opening_price)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium mb-1">Close</div>
                            <div className="text-sm font-bold text-white">{CURRENCY} {formatTZS(latest_price)}</div>
                        </div>
                    </div>
                </Card>

                {/* 3. Analyst Ratings */}
                <Card title="Analyst Ratings">
                    <p className="text-xs text-zinc-300 mb-6 leading-relaxed">
                        The price target is <span className="font-bold text-white">{CURRENCY} {formatTZS(latest_price * 1.1)}</span> and the stock is covered by 1 analyst.
                    </p>
                    <div className="space-y-1">
                        <RatingRow label="Buy" value={0} total={1} />
                        <RatingRow label="Hold" value={1} total={1} />
                        <RatingRow label="Sell" value={0} total={1} />
                    </div>
                </Card>

            </div>

        </div>
      </main>
    </div>
  );
};

export default memo(StockPage);