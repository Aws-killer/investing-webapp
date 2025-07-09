// features/api/stocksApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const stocksApi = createApi({
  reducerPath: "stocksApi",
  baseQuery,
  tagTypes: ["StockList", "StockDetail", "StockPrice"], // Added StockList
  endpoints: (builder) => ({
    getStocks: builder.query({
      query: () => "/stocks/list", // Updated to match curl example for a list
      providesTags: ["StockList"], // Tag for caching the list
      // Assuming response is { success: true, message: "...", data: { stocks: [{id, symbol, name}, ...] } }
      transformResponse: (response) => {
        if (response.success && response.data && response.data.stocks) {
          return response.data.stocks; // Directly return the array of stocks
        }
        return []; // Return empty array on failure or unexpected structure
      },
    }),
    getStockBySymbol: builder.query({
      query: (symbol) => `/stocks/${symbol}`, // This fetches details for a single stock
      providesTags: (result, error, symbol) => [
        { type: "StockDetail", id: symbol },
      ],
    }),
    getStockPrices: builder.query({
      query: (symbol) => `/stocks/${symbol}/prices`,
      providesTags: (result, error, symbol) => [
        { type: "StockPrice", id: symbol },
      ],
    }),
  }),
});

export const {
  useGetStocksQuery,
  useGetStockBySymbolQuery,
  useGetStockPricesQuery,
} = stocksApi;
