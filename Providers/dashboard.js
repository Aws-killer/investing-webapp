import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";
import {
  useGetPortfoliosQuery,
  useGetPortfolioTransactionsQuery,
  useGetPortfolioPositionsQuery, // <-- IMPORT NEW HOOK
  useGetPortfolioPerformanceQuery, // Import new hook
  useGetPortfolioCalendarQuery, // Import new hook
} from "@/features/api/portfoliosApi";

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userId = currentUser?.id;

  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [timeframe, setTimeframe] = useState("1M"); // State for performance period

  const { data: portfoliosApiResponse, isLoading: isLoadingPortfolios } =
    useGetPortfoliosQuery(userId, { skip: !userId });

  const portfolios = useMemo(
    () => portfoliosApiResponse?.data?.portfolios || [],
    [portfoliosApiResponse]
  );

  useEffect(() => {
    if (!selectedPortfolioId && portfolios.length > 0) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  // --- PERFORMANCE DATA HOOK ---
  const {
    data: performanceApiResponse,
    isLoading: isLoadingPerformance,
    isFetching: isFetchingPerformance,
    error: performanceError,
  } = useGetPortfolioPerformanceQuery(
    { portfolioId: selectedPortfolioId, period: timeframe },
    { skip: !selectedPortfolioId }
  );

  // --- CALENDAR DATA HOOK ---
  const {
    data: calendarApiResponse,
    isLoading: isLoadingCalendar,
    error: calendarError,
  } = useGetPortfolioCalendarQuery(selectedPortfolioId, {
    skip: !selectedPortfolioId,
  });

  const calendarEvents = useMemo(
    () => calendarApiResponse?.data?.events || [],
    [calendarApiResponse]
  );

  // --- TRANSACTIONS HOOK ---
  const {
    data: transactionsApiResponse,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetPortfolioTransactionsQuery(
    { portfolioId: selectedPortfolioId, userId, limit: 200, offset: 0 },
    { skip: !selectedPortfolioId || !userId }
  );

  const transactions = useMemo(
    () => transactionsApiResponse?.data?.transactions || [],
    [transactionsApiResponse]
  );

  // --- POSITIONS DATA HOOK ---
  const {
    data: positionsApiResponse,
    isLoading: isLoadingPositions,
    error: positionsError,
  } = useGetPortfolioPositionsQuery(selectedPortfolioId, {
    skip: !selectedPortfolioId,
  });

  const positions = useMemo(
    () => positionsApiResponse?.data?.positions || [],
    [positionsApiResponse]
  );

  const selectedPortfolio = useMemo(() => {
    return portfolios.find((p) => p.id === selectedPortfolioId);
  }, [portfolios, selectedPortfolioId]);

  // --- DERIVED DATA SECTION ---

  // New: Process performance data from API, handling pending states
  const performanceData = useMemo(() => {
    if (!performanceApiResponse) {
      return {
        isPending: false,
        pendingMessage: null,
        currentValue: 0,
        changeValue: 0,
        changePercentage: 0,
        timeseries: [],
      };
    }
    // Handle the case where the backend is generating data
    if (performanceApiResponse.success === false) {
      return {
        isPending: true,
        pendingMessage: performanceApiResponse.message,
        currentValue: 0,
        changeValue: 0,
        changePercentage: 0,
        timeseries: [],
      };
    }
    const data = performanceApiResponse.data;
    return {
      isPending: false,
      pendingMessage: null,
      currentValue: parseFloat(data.current_value) || 0,
      changeValue: parseFloat(data.change_value) || 0,
      changePercentage: parseFloat(data.change_percentage) || 0,
      timeseries: (data.timeseries || []).map((ts) => ({
        date: new Date(ts.date).toLocaleDateString(),
        value: parseFloat(ts.value),
      })),
    };
  }, [performanceApiResponse]);

  // The primary total value now comes from the performance endpoint.
  const totalPortfolioValue = performanceData.currentValue;

  // Update allocation calculation to use asset names and the new total value.
  const allocation = useMemo(() => {
    if (
      !transactions ||
      transactions.length === 0 ||
      totalPortfolioValue === 0
    ) {
      return [];
    }
    const holdings = new Map();
    transactions.forEach((tx) => {
      const assetKey = `${tx.asset_type}_${tx.asset_id}`;
      const quantity = parseFloat(tx.quantity);
      const total_amount = parseFloat(tx.total_amount);

      if (!holdings.has(assetKey)) {
        holdings.set(assetKey, {
          quantity: 0,
          totalCost: 0,
          asset_type: tx.asset_type,
          asset_id: tx.asset_id,
          name: tx.asset_name || tx.asset_type, // Use real asset name
        });
      }
      const currentHolding = holdings.get(assetKey);
      if (tx.transaction_type === "BUY") {
        currentHolding.quantity += quantity;
        currentHolding.totalCost += total_amount;
      } else if (tx.transaction_type === "SELL") {
        if (currentHolding.quantity > 0) {
          const costPerShare =
            currentHolding.totalCost / currentHolding.quantity;
          currentHolding.totalCost -= quantity * costPerShare;
        }
        currentHolding.quantity -= quantity;
      }
      currentHolding.quantity = Math.max(0, currentHolding.quantity);
      currentHolding.totalCost = Math.max(0, currentHolding.totalCost);
      holdings.set(assetKey, currentHolding);
    });

    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
    ];
    let colorIndex = 0;

    // Note: This allocation is by *cost basis*. The percentage is relative to current market value.
    return Array.from(holdings.values())
      .filter((h) => h.quantity > 0 && h.totalCost > 0)
      .map((h) => ({
        name: h.name || `${h.asset_type} ID ${h.asset_id}`,
        value: (h.totalCost / totalPortfolioValue) * 100,
        absoluteValue: h.totalCost,
        color: colors[colorIndex++ % colors.length],
      }));
  }, [transactions, totalPortfolioValue]);

  const value = {
    userId,
    portfolios,
    isLoadingPortfolios,
    selectedPortfolioId,
    setSelectedPortfolioId,
    selectedPortfolio,
    transactions,
    isLoadingTransactions,
    transactionsError,
    refetchTransactions,
    allocation,
    totalPortfolioValue,
    // Add new data to context
    timeframe,
    setTimeframe,
    performanceData,
    isLoadingPerformance,
    isFetchingPerformance,
    performanceError,
    calendarEvents,
    isLoadingCalendar,
    calendarError,
    positions,
    isLoadingPositions,
    positionsError,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
