import { useRouter } from 'next/router';
import {
  useGetStocksQuery,
  useGetStockPricesQuery,
  useGetStockMetricsQuery,
  useGetStockDividendsQuery,
} from '@/features/api/stocksApi';
import { useState, memo, useMemo } from 'react';
import { motion } from "framer-motion";
import { useCurrency } from '@/Providers/CurrencyProvider';
import { AppNavbar } from '@/components/AppNavbar'; // Import the new navbar
import { Skeleton } from '@/components/ui/skeleton';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Bar,
    YAxis,
    Tooltip,
    XAxis,
  } from "recharts";
import { ArrowUp, ArrowDown, ChevronDown, Star, Upload, Copy, Building, Briefcase, Users, Link as LinkIcon, Loader2, Plus } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- Reusable Card Component ---
const InfoCard = ({ children, className }) => (
    <div className={cn("rounded-xl border border-neutral-800 bg-neutral-900 p-6", className)}>
      {children}
    </div>
);

const StockPageSkeleton = () => (
    <div className="dark bg-neutral-950 text-neutral-200 min-h-screen font-sans animate-pulse">
        <AppNavbar />
        <main className="max-w-screen-2xl mx-auto p-4 md:p-8">
            {/* Header Skeleton */}
            <header className="mb-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="w-16 h-16 rounded-lg bg-neutral-800" />
                        <div>
                            <Skeleton className="h-10 w-48 mb-2 bg-neutral-800" />
                            <Skeleton className="h-6 w-32 bg-neutral-800" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-32 rounded-md bg-neutral-800" />
                        <Skeleton className="h-10 w-40 rounded-md bg-neutral-800" />
                    </div>
                </div>
                <div className="flex items-baseline space-x-3">
                    <Skeleton className="h-14 w-56 bg-neutral-800" />
                    <Skeleton className="h-8 w-40 bg-neutral-800" />
                </div>
            </header>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <InfoCard>
                        <div className="flex justify-between items-center mb-4">
                            <Skeleton className="h-8 w-40 bg-neutral-800" />
                            <div className="flex space-x-1">
                                <Skeleton className="h-8 w-12 bg-neutral-800" />
                                <Skeleton className="h-8 w-12 bg-neutral-800" />
                                <Skeleton className="h-8 w-12 bg-neutral-800" />
                            </div>
                        </div>
                        <Skeleton className="h-96 w-full bg-neutral-800" />
                    </InfoCard>
                    <InfoCard>
                        <Skeleton className="h-8 w-48 mb-4 bg-neutral-800" />
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full bg-neutral-800" />
                            <Skeleton className="h-12 w-full bg-neutral-800" />
                            <Skeleton className="h-12 w-full bg-neutral-800" />
                        </div>
                    </InfoCard>
                </div>

                {/* Right Sidebar Skeleton */}
                <div className="lg:col-span-1 space-y-8">
                    <InfoCard>
                        <Skeleton className="h-8 w-40 mb-4 bg-neutral-800" />
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-full bg-neutral-800" />
                            <Skeleton className="h-6 w-full bg-neutral-800" />
                            <Skeleton className="h-6 w-full bg-neutral-800" />
                            <Skeleton className="h-6 w-full bg-neutral-800" />
                        </div>
                    </InfoCard>
                    <InfoCard>
                        <Skeleton className="h-8 w-48 mb-4 bg-neutral-800" />
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full bg-neutral-800" />
                            <Skeleton className="h-10 w-full bg-neutral-800" />
                            <Skeleton className="h-10 w-full bg-neutral-800" />
                        </div>
                    </InfoCard>
                </div>
            </div>
        </main>
    </div>
);


// --- FAQ Accordion Component ---
const FaqItem = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-neutral-800 py-4 last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between text-left text-lg">
                <span className="font-semibold text-neutral-100">{question}</span>
                <ChevronDown className={cn("h-5 w-5 text-neutral-400 transform transition-transform duration-300", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 text-neutral-300 text-base"
                >
                    {children}
                </motion.div>
            )}
        </div>
    );
};

// --- Custom Chart Tooltip ---
const ChartTooltip = ({ active, payload, label, formatAmount }) => {
    if (active && payload && payload.length) {
        const price = payload.find(p => p.dataKey === 'closing_price');
        const volume = payload.find(p => p.dataKey === 'volume');
        const date = new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        return (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/80 p-3 text-sm shadow-lg backdrop-blur-sm">
            <p className="font-bold text-white mb-1">{date}</p>
            {price && <p className="text-teal-400">{`Price: ${formatAmount(price.value)}`}</p>}
            {volume && <p className="text-sky-400">{`Volume: ${Number(volume.value).toLocaleString()}`}</p>}
        </div>
        );
    }
    return null;
};

const KeyMetric = ({ label, value, children }) => (
    <div className="flex justify-between items-center py-3 border-b border-neutral-800 last:border-b-0">
        <span className="text-neutral-400 text-sm">{label}</span>
        <span className="font-semibold text-white text-sm">{value}</span>
        {children}
    </div>
)

const StockPage = () => {
  const router = useRouter();
  const { symbol } = router.query;
  const { formatAmount } = useCurrency();
  const [timeRange, setTimeRange] = useState('1y');

  const { data: stocks, isLoading: areStocksLoading } = useGetStocksQuery();
  const { data: pricesData, isLoading: arePricesLoading } = useGetStockPricesQuery(
    { symbol, time_range: timeRange, page_size: 365 },
    { skip: !symbol }
  );
  const { data: metrics, isLoading: areMetricsLoading } = useGetStockMetricsQuery(symbol, { skip: !symbol });
  const { data: dividends, isLoading: areDividendsLoading } = useGetStockDividendsQuery(symbol, { skip: !symbol });

  const isLoading = areStocksLoading || (symbol && areMetricsLoading);

  const stock = useMemo(() => stocks?.find((s) => s.symbol === symbol?.toUpperCase()), [stocks, symbol]);

  const week52 = useMemo(() => {
    if (pricesData?.prices && pricesData.prices.length > 0) {
        const highs = pricesData.prices.map(p => p.high);
        const lows = pricesData.prices.map(p => p.low);
        return {
            high: Math.max(...highs),
            low: Math.min(...lows)
        };
    }
    return { high: stock?.high || 0, low: stock?.low || 0 };
  }, [pricesData, stock]);
  
  if (isLoading) {
    return <StockPageSkeleton />;
  }

  if (!stock && !areStocksLoading) {
      return (
        <div className="dark bg-neutral-950 text-white min-h-screen">
            <AppNavbar />
            <div className="p-8 text-center">Stock with symbol '{symbol?.toUpperCase()}' not found.</div>
        </div>
      );
  }
  
  const { latest_price = 0, opening_price = 0, market_cap = 0, name, high, low, volume } = stock || {};
  const changeValue = latest_price - opening_price;
  const changePercentage = opening_price ? (changeValue / opening_price) * 100 : 0;
  const changeIsPositive = changeValue >= 0;

  const pricePosition = week52.high > week52.low ? ((latest_price - week52.low) / (week52.high - week52.low)) * 100 : 50;

  return (
    <div className="dark bg-neutral-950 text-neutral-200 min-h-screen font-sans">
        <AppNavbar />
        <main className="max-w-screen-2xl mx-auto p-4 md:p-8">
            {/* --- Header --- */}
            <header className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center font-bold text-2xl text-teal-400">{symbol?.toUpperCase()}</div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">{name}</h1>
                            <div className="text-md text-neutral-400">
                                <span>Stock</span>
                                {metrics?.isin && <span className="mx-2">&#8226;</span>}
                                {metrics?.isin && <span>ISIN: {metrics.isin}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"><Star className="h-5 w-5 mr-2"/> Watchlist</Button>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white"><Plus className="h-5 w-5 mr-2"/> Add Transaction</Button>
                    </div>
                </div>
                <div className="flex items-baseline space-x-3">
                    <span className="text-5xl font-bold text-white">{formatAmount(latest_price)}</span>
                    <div className={cn("flex items-center text-xl", changeIsPositive ? "text-green-400" : "text-red-400")}>
                        {changeIsPositive ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                        <span>{formatAmount(changeValue)} ({changePercentage}%)</span>
                    </div>
                </div>
            </header>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Left Column --- */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <InfoCard>
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                             <h3 className="text-xl font-bold text-white">Price Performance</h3>
                             <div className="flex space-x-1 bg-neutral-800 rounded-md p-1">
                                 {['1W', '1M', '1Y', 'YTD', 'Max'].map(range => (
                                     <Button key={range} onClick={() => setTimeRange(range.toLowerCase())} variant={timeRange === range.toLowerCase() ? 'secondary' : 'ghost'} size="sm" className="data-[state=active]:bg-neutral-700">
                                         {range}
                                     </Button>
                                 ))}
                             </div>
                        </div>
                        {arePricesLoading ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500"/></div> : (
                            <div className="h-96 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={pricesData?.prices.slice().reverse()} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                        <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString()} hide />
                                        <YAxis yAxisId="left" orientation="left" hide domain={['dataMin * 0.98', 'dataMax * 1.02']} />
                                        <YAxis yAxisId="right" orientation="right" hide domain={[0, 'dataMax * 5']} />
                                        <Tooltip content={<ChartTooltip formatAmount={formatAmount}/>} cursor={{ stroke: "#6b7280", strokeWidth: 1, strokeDasharray: "3 3" }} />
                                        <defs>
                                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Line yAxisId="left" type="monotone" dataKey="closing_price" stroke="#14b8a6" strokeWidth={2.5} dot={false} name="Price" />
                                        <Bar yAxisId="right" dataKey="volume" barSize={20} fill="#0ea5e9" name="Volume" fillOpacity={0.2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </InfoCard>

                    {dividends && dividends.length > 0 && (
                        <InfoCard>
                            <h3 className="text-xl font-bold mb-4 text-white">Dividend History</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-neutral-800">
                                        <TableHead className="text-neutral-400">Ex-Date</TableHead>
                                        <TableHead className="text-neutral-400">Payment Date</TableHead>
                                        <TableHead className="text-right text-neutral-400">Amount Per Share</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dividends.slice(0, 5).map((div, i) => (
                                        <TableRow key={i} className="border-neutral-800">
                                            <TableCell>{new Date(div.ex_dividend_date).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(div.payment_date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-400">{formatAmount(div.amount_per_share)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </InfoCard>
                    )}
                </div>

                {/* --- Right Sidebar --- */}
                <div className="lg:col-span-1 space-y-8">
                    <InfoCard>
                        <h3 className="text-xl font-bold text-white mb-4">Key Statistics</h3>
                        <KeyMetric label="Market Cap" value={formatAmount(market_cap)} />
                        <KeyMetric label="P/E Ratio" value={metrics?.pe_ratio ? metrics.pe_ratio : 'N/A'} />
                        <KeyMetric label="EPS (TTM)" value={metrics?.eps ? formatAmount(metrics.eps) : 'N/A'} />
                        <KeyMetric label="Dividend Yield" value={metrics?.dividend_yield ? `${(metrics.dividend_yield * 100)}%` : 'N/A'} />
                        <KeyMetric label="Volume" value={volume ? volume.toLocaleString() : 'N/A'} />
                        <KeyMetric label="Beta" value={metrics?.beta ? metrics.beta : 'N/A'} />
                    </InfoCard>
                    
                    <InfoCard>
                        <h3 className="text-xl font-bold text-white mb-4">Company Info</h3>
                        {metrics?.description && <p className="text-base text-neutral-300 mb-6">{metrics.description}</p>}
                        
                        <div className="space-y-4 text-sm">
                           <div className="flex items-center">
                               <Briefcase className="w-5 h-5 mr-3 text-neutral-500"/>
                               <span className="text-neutral-400 mr-2">Industry:</span>
                               <span className="font-semibold text-white">{metrics?.industry || 'N/A'}</span>
                           </div>
                           <div className="flex items-center">
                               <Building className="w-5 h-5 mr-3 text-neutral-500"/>
                               <span className="text-neutral-400 mr-2">Sector:</span>
                               <span className="font-semibold text-white">{metrics?.sector || 'N/A'}</span>
                           </div>
                           <div className="flex items-center">
                               <Users className="w-5 h-5 mr-3 text-neutral-500"/>
                               <span className="text-neutral-400 mr-2">Employees:</span>
                               <span className="font-semibold text-white">{metrics?.employees ? metrics.employees.toLocaleString() : 'N/A'}</span>
                           </div>
                           {metrics?.website && (
                               <div className="flex items-center">
                                   <LinkIcon className="w-5 h-5 mr-3 text-neutral-500"/>
                                   <span className="text-neutral-400 mr-2">Website:</span>
                                   <a href={metrics.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-400 hover:underline">
                                       {metrics.website}
                                   </a>
                               </div>
                           )}
                        </div>
                    </InfoCard>
                </div>
            </div>
        </main>
    </div>
  );
};

export default memo(StockPage);
