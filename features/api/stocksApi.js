// features/api/stocksApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const stocksApi = createApi({
  reducerPath: "stocksApi",
  baseQuery,
  tagTypes: ["StockList", "StockPrice", "StockMetrics", "StockDividends"],
  endpoints: (builder) => ({
    importStock: builder.mutation({
      query: (symbol) => ({
        url: `/stocks/import/${symbol}`,
        method: "POST",
      }),
    }),
    getStocks: builder.query({
      query: () => "/stocks/list",
      providesTags: ["StockList"],
      transformResponse: (response) => {
        if (response.success && response.data && response.data.stocks) {
          return response.data.stocks;
        }
        return [];
      },
    }),
    getStockPrices: builder.query({
      query: ({ symbol, time_range = "max", page = 1, page_size = 100 }) => ({
        url: `/stocks/${symbol}/prices`,
        params: { time_range, page, page_size },
      }),
      providesTags: (result, error, { symbol }) => [
        { type: "StockPrice", id: symbol },
      ],
      transformResponse: (response) => {
        if (response.success && response.data) {
          return response.data; // Includes prices and pagination
        }
        return { prices: [], pagination: {} };
      },
    }),
    getStockMetrics: builder.query({
      query: (symbol) => `/stocks/${symbol}/metrics`,
      providesTags: (result, error, symbol) => [
        { type: "StockMetrics", id: symbol },
      ],
      transformResponse: (response) => {
        if (response.success && response.data && response.data.metrics) {
          return response.data.metrics;
        }
        return {};
      },
    }),
    getStockDividends: builder.query({
      query: (symbol) => `/stocks/${symbol}/dividends`,
      providesTags: (result, error, symbol) => [
        { type: "StockDividends", id: symbol },
      ],
      transformResponse: (response) => {
        if (response.success && response.data && response.data.dividends) {
          // Parse the dividend_amount which can be in scientific notation
          return response.data.dividends.map((dividend) => ({
            ...dividend,
            amount_per_share: parseFloat(dividend.dividend_amount),
          }));
        }
        return [];
      },
    }),
  }),
});

export const {
  useImportStockMutation,
  useGetStocksQuery,
  useGetStockPricesQuery,
  useGetStockMetricsQuery,
  useGetStockDividendsQuery,
} = stocksApi;
