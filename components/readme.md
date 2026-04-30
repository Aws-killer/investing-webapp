Update components/AppNavbar.jsx
Replace the static inputs with the new GlobalSearch.
code
Jsx
// components/AppNavbar.jsx
// ... existing imports
import { GlobalSearch } from "./GlobalSearch"; // Import the new component

// ... existing utility code (haptic, cn, Drawer, BottomBar) ...

const Navbar = () => {
  const userId = useCurrentUserId();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // ... existing logic ...

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-zinc-800 h-14 flex items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            className="md:hidden h-12 w-12 flex items-center justify-center rounded-md hover:bg-zinc-800 active:scale-95 transition"
            aria-label="Open menu"
            onClick={() => { haptic.light(); setMenuOpen(true); }}
          >
            <Menu size={22} className="text-zinc-400" />
          </button>
          
          <Link href="/" className="font-bold text-base md:text-lg text-zinc-200 tracking-tight hover:text-white transition-colors">
            getquin
          </Link>
        </div>

        {/* Updated Desktop Search */}
        {userId && (
          <div className="hidden md:flex flex-1 max-w-xl mx-6">
             <GlobalSearch placeholder="Search for stocks, funds, or symbols..." />
          </div>
        )}

        {/* ... existing right side actions ... */}
      </nav>

      {/* Mobile drawer menu */}
      <Drawer open={isMobile && menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="space-y-1">
          {userId && (
            <div className="px-2 pb-4 pt-2">
               {/* Updated Mobile Search */}
               <GlobalSearch 
                  placeholder="Search..." 
                  onNavigate={() => setMenuOpen(false)} 
               />
            </div>
          )}

          {/* ... rest of drawer content ... */}
        </div>
      </Drawer>

      {/* ... BottomBar logic ... */}
    </>
  );
};

export const AppNavbar = () => {
  return <Navbar />;
};
3. Updated pages/stocks/[symbol].jsx
I will add a HistoricalPerformance component inside the page that dynamically calculates returns based on the historical price data fetched.
code
Jsx
// pages/stocks/[symbol].jsx

// ... existing imports ...
// Add these imports if missing
import { Table, ArrowUp, ArrowDown } from 'lucide-react'; 

/* --- NEW COMPONENT: Historical Performance Calculator --- */
const HistoricalPerformance = ({ prices }) => {
  const calculations = useMemo(() => {
    if (!prices || prices.length < 2) return [];

    // Prices are usually sorted newest first (index 0 = today)
    const sorted = [...prices].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0];
    const latestPrice = Number(latest.closing_price);

    const getReturn = (daysAgo) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);
      
      // Find price closest to target date (but not in future relative to target)
      const historical = sorted.find(p => new Date(p.date) <= targetDate);
      
      if (!historical) return null;
      
      const oldPrice = Number(historical.closing_price);
      const change = latestPrice - oldPrice;
      const percent = (change / oldPrice) * 100;
      
      return { change, percent, date: historical.date, price: oldPrice };
    };

    const periods = [
      { label: '1 Day', days: 1 },
      { label: '1 Week', days: 7 },
      { label: '1 Month', days: 30 },
      { label: '3 Months', days: 90 },
      { label: '6 Months', days: 180 },
      { label: 'YTD', days: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)) },
      { label: '1 Year', days: 365 },
    ];

    return periods.map(p => ({
      ...p,
      data: getReturn(p.days)
    }));
  }, [prices]);

  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Table size={16} className="text-zinc-400" />
        Historical Returns
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Period</th>
              <th className="px-4 py-3 text-right">Return (%)</th>
              <th className="px-4 py-3 text-right">Change (TZS)</th>
              <th className="px-4 py-3 text-right rounded-r-lg">Ref Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {calculations.map((item) => (
              <tr key={item.label} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-300">{item.label}</td>
                <td className="px-4 py-3 text-right">
                  {item.data ? (
                    <span className={cn(
                      "flex items-center justify-end gap-1 font-medium",
                      item.data.percent >= 0 ? "text-[#81c995]" : "text-[#f28b82]"
                    )}>
                      {item.data.percent >= 0 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                      {Math.abs(item.data.percent).toFixed(2)}%
                    </span>
                  ) : <span className="text-zinc-600">-</span>}
                </td>
                <td className="px-4 py-3 text-right text-zinc-400">
                  {item.data ? (
                    <span className={item.data.change >= 0 ? "text-[#81c995]" : "text-[#f28b82]"}>
                      {item.data.change > 0 ? "+" : ""}{item.data.change.toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right text-zinc-500">
                   {item.data ? formatTZS(item.data.price) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

/* --- MAIN PAGE COMPONENT --- */

const StockPage = () => {
  // ... existing code ...
  
  // Fetch more history for calculations regardless of chart view
  const { data: fullHistory } = useGetStockPricesQuery(
    { symbol: safeSymbol, period: '5Y', limit: 2000 },
    { skip: !safeSymbol }
  );

  // ... existing code ...

  return (
    <PageLayout>
      <Container size="default" className="py-8">
        {/* ... Header Section ... */}

        {/* ... Price Section ... */}

        <ContentGrid>
          <MainContent>
            {/* Chart Section */}
            {/* ... Chart code ... */}

            {/* NEW: Performance Table */}
            <HistoricalPerformance prices={fullHistory?.prices} />

            {/* Dividend/Events Timeline */}
            <EventsTimeline dividends={dividends} name={name} />
          </MainContent>

          <Sidebar>
             {/* ... Sidebar contents ... */}
          </Sidebar>
        </ContentGrid>
      </Container>
    </PageLayout>
  );
};

export default memo(StockPage);
4. Updated pages/funds/[fund].jsx
Similarly, adding the performance calculation for funds.
code
Jsx
// pages/funds/[fund].jsx

// ... existing imports ...
import { Table, ArrowUp, ArrowDown } from 'lucide-react';

/* --- NEW COMPONENT: Fund Performance Calculator --- */
const FundPerformanceTable = ({ prices }) => {
  const calculations = useMemo(() => {
    if (!prices || prices.length < 2) return [];

    // Ensure sorting by date descending
    const sorted = [...prices].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0];
    const latestNav = Number(latest.nav_per_unit || latest.price);

    const getReturn = (daysAgo) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);
      
      const historical = sorted.find(p => new Date(p.date) <= targetDate);
      
      if (!historical) return null;
      
      const oldNav = Number(historical.nav_per_unit || historical.price);
      const change = latestNav - oldNav;
      const percent = (change / oldNav) * 100;
      
      return { change, percent, date: historical.date, price: oldNav };
    };

    const periods = [
      { label: '1 Day', days: 1 },
      { label: '1 Month', days: 30 },
      { label: '3 Months', days: 90 },
      { label: '6 Months', days: 180 },
      { label: 'YTD', days: Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)) },
      { label: '1 Year', days: 365 },
      { label: '3 Years', days: 365 * 3 },
    ];

    return periods.map(p => ({
      ...p,
      data: getReturn(p.days)
    }));
  }, [prices]);

  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Table size={16} className="text-[#c58af9]" />
        Detailed Performance
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Period</th>
              <th className="px-4 py-3 text-right">Return (%)</th>
              <th className="px-4 py-3 text-right">NAV Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {calculations.map((item) => (
              <tr key={item.label} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-300">{item.label}</td>
                <td className="px-4 py-3 text-right">
                  {item.data ? (
                    <span className={cn(
                      "flex items-center justify-end gap-1 font-medium",
                      item.data.percent >= 0 ? "text-[#81c995]" : "text-[#f28b82]"
                    )}>
                      {item.data.percent >= 0 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                      {Math.abs(item.data.percent).toFixed(2)}%
                    </span>
                  ) : <span className="text-zinc-600">-</span>}
                </td>
                <td className="px-4 py-3 text-right text-zinc-400">
                  {item.data ? (
                    <span className={item.data.change >= 0 ? "text-[#81c995]" : "text-[#f28b82]"}>
                      {item.data.change > 0 ? "+" : ""}{item.data.change.toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

/* --- MAIN FUND PAGE --- */
const FundPage = () => {
  // ... existing code ...
  
  // Fetch ample history for table calculations
  const { data: fullHistory } = useGetFundPricesQuery(
    { symbol, period: '5Y', limit: 2000 },
    { skip: !symbol }
  );

  // ... existing code ...

  return (
    <PageLayout>
      <Container size="default" className="py-8">
        {/* ... Header & Prices ... */}

        <ContentGrid>
          <MainContent>
            {/* Chart */}
            {/* ... Chart Code ... */}
            
            {/* NEW: Performance Table */}
            <FundPerformanceTable prices={fullHistory?.prices} />

            {/* Holdings Section */}
            {/* ... */}
          </MainContent>

          <Sidebar>
            {/* ... Sidebar contents ... */}
          </Sidebar>
        </ContentGrid>
      </Container>
    </PageLayout>
  );
};

export default memo(FundPage);
Summary of Improvements
Global Search: Users can now type anywhere. It queries both your stock and fund APIs, merges the results, identifies the type (Stock vs Fund), and routes to the correct detail page.
Performance Calculation: Instead of relying solely on the backend to provide pre-calculated returns (which might be missing or cached), the frontend now takes the raw historical price data and calculates Daily, Monthly, YTD, and 1-Year returns on the fly.
Visuals: Added color coding (Green/Red) for positive/negative performance, and distinct icons for Stocks vs Funds in the search dropdown.