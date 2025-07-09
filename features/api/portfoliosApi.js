// ## import { createApi } from "@reduxjs/toolkit/query/react";
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
      query: (userId) => `/portfolios?user_id=${userId}`,
      providesTags: (result, error, userId) =>
        result && result.data && result.data.portfolios
          ? [
              ...result.data.portfolios.map(({ id }) => ({
                type: "Portfolio",
                id,
              })),
              { type: "Portfolio", id: "LIST", userId },
            ]
          : [{ type: "Portfolio", id: "LIST", userId }],
    }),
    getPortfolioById: builder.query({
      query: ({ userId, portfolioId }) =>
        `/portfolios/${portfolioId}?user_id=${userId}`,
      providesTags: (result, error, { portfolioId }) => [
        { type: "PortfolioSummary", id: portfolioId },
      ],
    }),
    createPortfolio: builder.mutation({
      query: (portfolioData) => ({
        url: "/portfolios",
        method: "POST",
        body: portfolioData,
      }),
      // Assuming userIdUsedForGetPortfolios is part of portfolioData
      invalidatesTags: (result, error, { userIdUsedForGetPortfolios }) => [
        { type: "Portfolio", id: "LIST", userId: userIdUsedForGetPortfolios },
      ],
    }),
    updatePortfolio: builder.mutation({
      query: ({ portfolioId, ...update }) => ({
        url: `/portfolios/${portfolioId}`,
        method: "PUT",
        body: update,
      }),
      invalidatesTags: (result, error, { portfolioId, userId }) => [
        { type: "Portfolio", id: portfolioId },
        { type: "PortfolioSummary", id: portfolioId },
        { type: "Portfolio", id: "LIST", userId }, // Also invalidate list in case name changed
      ],
    }),
    // highlight-start
    deletePortfolio: builder.mutation({
      query: ({ portfolioId, userId }) => {
        console.log(
          "Deleting portfolio with ID:",
          portfolioId,
          "for user:",
          userId
        );
        return {
          url: `/portfolios/${portfolioId}?user_id=${userId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "Portfolio", id: "LIST", userId },
      ],
    }),
    // highlight-end
    getPortfolioTransactions: builder.query({
      query: ({ portfolioId, userId, limit = 50, offset = 0 }) =>
        `/portfolios/${portfolioId}/transactions?user_id=${userId}&limit=${limit}&offset=${offset}`,
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

    // --- NEW PERFORMANCE & CALENDAR QUERIES ---
    getPortfolioPerformance: builder.query({
      query: ({ portfolioId, period }) =>
        `/portfolios/${portfolioId}/performance?period=${period}`,
      providesTags: (result, error, { portfolioId }) => [
        { type: "PortfolioPerformance", id: portfolioId },
      ],
    }),

    getPortfolioCalendar: builder.query({
      // Using default date ranges by not passing params
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

    // --- MUTATIONS (Updated with invalidatesTags) ---
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
    addUttToPortfolio: builder.mutation({
      query: ({ portfolioId, uttData }) => ({
        url: `/portfolios/${portfolioId}/utts`,
        method: "POST",
        body: uttData,
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
    sellUttFromPortfolio: builder.mutation({
      query: ({ portfolioId, uttFundId, sellData }) => ({
        url: `/portfolios/${portfolioId}/utts/${uttFundId}/sell`,
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
  }),
});

export const {
  useGetPortfoliosQuery,
  useGetPortfolioByIdQuery,
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  // highlight-start
  useDeletePortfolioMutation,
  // highlight-end
  useGetPortfolioTransactionsQuery,
  useAddStockToPortfolioMutation,
  useAddUttToPortfolioMutation,
  useAddBondToPortfolioMutation,
  useSellStockFromPortfolioMutation,
  useSellUttFromPortfolioMutation,
  useSellBondFromPortfolioMutation,
  useGetPortfolioPerformanceQuery,
  useGetPortfolioCalendarQuery,
  useGetPortfolioPositionsQuery,
} = portfoliosApi;
