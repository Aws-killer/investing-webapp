// features/api/uttApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const uttApi = createApi({
  reducerPath: "uttApi",
  baseQuery,
  tagTypes: ["UttFundList", "UttFundDetail", "UttPrice"], // Added UttFundList
  endpoints: (builder) => ({
    getUttFunds: builder.query({
      query: () => "/utt", // This endpoint returns the list of UTT funds
      providesTags: ["UttFundList"], // Tag for caching the list
      // Assuming response is { success: true, message: "...", data: [{id, symbol, name}, ...] }
      transformResponse: (response) => {
        if (response.success && response.data) {
          return response.data; // Directly return the array of funds
        }
        return []; // Return empty array on failure or unexpected structure
      },
    }),
    getUttById: builder.query({
      // This might be by symbol as well based on /utt/{symbol} for prices
      query: (uttIdentifier) => `/utt/${uttIdentifier}`, // Assuming uttIdentifier can be ID or symbol
      providesTags: (result, error, uttIdentifier) => [
        { type: "UttFundDetail", id: uttIdentifier },
      ],
    }),
    getUttPrices: builder.query({
      query: (uttSymbolOrId) => `/utt/${uttSymbolOrId}`, // Your example used /utt/umoja
      // The prices are part of the fund detail response
      providesTags: (result, error, uttSymbolOrId) => [
        { type: "UttPrice", id: uttSymbolOrId },
      ],
      // This endpoint structure from your example actually returns fund data including prices.
      // If there was a separate /utt/{id}/prices, you'd use that.
      // For now, it seems getUttById/getUttPrices might fetch similar data.
      // Let's assume /utt/{symbol_or_id} gives details + prices.
      // The `getUttPrices` query specifically might be fetching the detailed view which includes price history.
    }),
    // REMOVED addUttToPortfolio mutation - it's handled in portfoliosApi.js
  }),
});

export const {
  useGetUttFundsQuery,
  useGetUttByIdQuery, // This can be used to get details if needed separately
  useGetUttPricesQuery, // This is likely for fetching price history
} = uttApi;
