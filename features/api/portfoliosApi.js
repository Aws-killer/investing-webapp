import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const portfoliosApi = createApi({
  reducerPath: "portfoliosApi",
  baseQuery,
  tagTypes: [
    "Portfolio",
    "Transaction",
    "PortfolioSummary",
    "PortfolioPerformance",
    "PortfolioCalendar",
    "PortfolioPositions",
  ],
  endpoints: (builder) => ({
    getPortfolios: builder.query({
      query: () => `/portfolios`,
      providesTags: (result) =>
        result && result.data && result.data.portfolios
          ? [
              ...result.data.portfolios.map(({ id }) => ({
                type: "Portfolio",
                id,
              })),
              { type: "Portfolio", id: "LIST" },
            ]
          : [{ type: "Portfolio", id: "LIST" }],
    }),
    getPortfolioById: builder.query({
      query: (portfolioId) => `/portfolios/${portfolioId}`,
      providesTags: (result, error, portfolioId) => [
        { type: "PortfolioSummary", id: portfolioId },
      ],
    }),
    createPortfolio: builder.mutation({
      query: (portfolioData) => ({
        url: "/portfolios",
        method: "POST",
        body: portfolioData,
      }),
      invalidatesTags: [{ type: "Portfolio", id: "LIST" }],
    }),
    updatePortfolio: builder.mutation({
      query: ({ portfolioId, ...update }) => ({
        url: `/portfolios/${portfolioId}`,
        method: "PUT",
        body: update,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Portfolio", id: portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "Portfolio", id: "LIST" },
      ],
    }),
    deletePortfolio: builder.mutation({
      query: (portfolioId) => ({
        url: `/portfolios/${portfolioId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Portfolio", id: "LIST" }],
    }),
    getPortfolioTransactions: builder.query({
      query: ({ portfolioId, limit = 50, offset = 0 }) =>
        `/portfolios/${portfolioId}/transactions?limit=${limit}&offset=${offset}`,
      providesTags: (result, error, { portfolioId }) =>
        result && result.data && result.data.transactions
          ? [
              ...result.data.transactions.map(({ id }) => ({
                type: "Transaction",
                id,
                portfolioId,
              })),
              { type: "Transaction", id: "LIST", portfolioId },
            ]
          : [{ type: "Transaction", id: "LIST", portfolioId }],
    }),

    // --- PERFORMANCE & CALENDAR QUERIES ---
    getPortfolioPerformance: builder.query({
      query: ({ portfolioId, period }) =>
        `/portfolios/${portfolioId}/performance?period=${period}`,
      providesTags: (result, error, { portfolioId }) => [
        { type: "PortfolioPerformance", id: portfolioId },
      ],
    }),

    getPortfolioCalendar: builder.query({
      query: (portfolioId) => `/portfolios/${portfolioId}/calendar`,
      providesTags: (result, error, portfolioId) => [
        { type: "PortfolioCalendar", id: portfolioId },
      ],
    }),

    getPortfolioPositions: builder.query({
      query: (portfolioId) => `/portfolios/${portfolioId}/positions`,
      providesTags: (result, error, portfolioId) => [
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    getPortfolioHoldings: builder.query({
      query: (portfolioId) => `/portfolios/${portfolioId}/positions`,
      transformResponse: (response) => {
        if (response?.data?.positions) {
          return response.data.positions.map((p) => ({
            asset_id: p.asset_id,
            asset_type: p.asset_type.toUpperCase(),
            ...p,
          }));
        }
        return [];
      },
      providesTags: (result, error, portfolioId) => [
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    // --- ADD MUTATIONS ---
    addStockToPortfolio: builder.mutation({
      query: ({ portfolioId, stockData }) => ({
        url: `/portfolios/${portfolioId}/stocks`,
        method: "POST",
        body: stockData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    addFundToPortfolio: builder.mutation({
      query: ({ portfolioId, fundData }) => ({
        url: `/portfolios/${portfolioId}/funds`,
        method: "POST",
        body: fundData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    addBondToPortfolio: builder.mutation({
      query: ({ portfolioId, bondData }) => ({
        url: `/portfolios/${portfolioId}/bonds`,
        method: "POST",
        body: bondData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    // --- SELL MUTATIONS ---
    sellStockFromPortfolio: builder.mutation({
      query: ({ portfolioId, stockId, sellData }) => ({
        url: `/portfolios/${portfolioId}/stocks/${stockId}/sell`,
        method: "POST",
        body: sellData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    sellFundFromPortfolio: builder.mutation({
      query: ({ portfolioId, fundId, sellData }) => ({
        url: `/portfolios/${portfolioId}/funds/${fundId}/sell`,
        method: "POST",
        body: sellData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    sellBondFromPortfolio: builder.mutation({
      query: ({ portfolioId, bondId, sellData }) => ({
        url: `/portfolios/${portfolioId}/bonds/${bondId}/sell`,
        method: "POST",
        body: sellData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    // --- UPDATE HOLDING MUTATIONS ---
    updateStockHolding: builder.mutation({
      query: ({ portfolioId, stockId, stockData }) => ({
        url: `/portfolios/${portfolioId}/stocks/${stockId}`,
        method: "PUT",
        body: stockData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    updateFundHolding: builder.mutation({
      query: ({ portfolioId, fundId, fundData }) => ({
        url: `/portfolios/${portfolioId}/funds/${fundId}`,
        method: "PUT",
        body: fundData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    updateBondHolding: builder.mutation({
      query: ({ portfolioId, bondId, bondData }) => ({
        url: `/portfolios/${portfolioId}/bonds/${bondId}`,
        method: "PUT",
        body: bondData,
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    // --- DELETE HOLDING MUTATIONS ---
    deleteStockHolding: builder.mutation({
      query: ({ portfolioId, stockId }) => ({
        url: `/portfolios/${portfolioId}/stocks/${stockId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    deleteFundHolding: builder.mutation({
      query: ({ portfolioId, fundId }) => ({
        url: `/portfolios/${portfolioId}/funds/${fundId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),

    deleteBondHolding: builder.mutation({
      query: ({ portfolioId, bondId }) => ({
        url: `/portfolios/${portfolioId}/bonds/${bondId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { portfolioId }) => [
        { type: "Transaction", id: "LIST", portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "PortfolioPerformance", id: portfolioId },
        { type: "PortfolioCalendar", id: portfolioId },
        { type: "PortfolioPositions", id: portfolioId },
      ],
    }),
  }),
});

export const {
  useGetPortfoliosQuery,
  useGetPortfolioByIdQuery,
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  useDeletePortfolioMutation,
  useGetPortfolioTransactionsQuery,

  // Add mutations
  useAddStockToPortfolioMutation,
  useAddFundToPortfolioMutation,
  useAddBondToPortfolioMutation,

  // Sell mutations
  useSellStockFromPortfolioMutation,
  useSellFundFromPortfolioMutation,
  useSellBondFromPortfolioMutation,

  // Update mutations
  useUpdateStockHoldingMutation,
  useUpdateFundHoldingMutation,
  useUpdateBondHoldingMutation,

  // Delete mutations
  useDeleteStockHoldingMutation,
  useDeleteFundHoldingMutation,
  useDeleteBondHoldingMutation,

  // Query hooks
  useGetPortfolioPerformanceQuery,
  useGetPortfolioCalendarQuery,
  useGetPortfolioPositionsQuery,
  useGetPortfolioHoldingsQuery,
} = portfoliosApi;
