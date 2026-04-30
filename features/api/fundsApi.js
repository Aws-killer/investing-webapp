import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const fundsApi = createApi({
  reducerPath: "fundsApi",
  baseQuery,
  tagTypes: ["FundList", "FundPrice", "Fund"],
  endpoints: (builder) => ({
    // GET /funds  →  { success, data: { funds: [...], count } }
    getFunds: builder.query({
      query: () => "/funds",
      providesTags: ["FundList"],
      transformResponse: (response) => {
        if (response.success && response.data?.funds) {
          return response.data.funds;
        }
        return [];
      },
    }),

    // GET /funds/{symbol}  →  { success, data: { id, symbol, name, nav_per_unit, prices: [...], info: {...}, ... } }
    getFundBySymbol: builder.query({
      query: (symbol) => `/funds/${symbol}`,
      providesTags: (result, error, symbol) => [{ type: "Fund", id: symbol }],
      transformResponse: (response) => {
        if (response.success && response.data) {
          // Return fund metadata without the price array
          const { prices, pagination, ...fundMeta } = response.data;
          return fundMeta;
        }
        return null;
      },
    }),

    // GET /funds/info/all — static fund details from offer documents
    getFundsInfo: builder.query({
      query: () => "/funds/info/all",
      transformResponse: (response) => {
        if (response.success && response.data?.funds)
          return response.data.funds;
        return [];
      },
    }),

    // GET /funds/{identifier}?period=&page=&limit=  →  { success, data: { id, name, nav_per_unit, prices: [...], info: {...}, pagination } }
    getFundPrices: builder.query({
      query: ({ identifier, period = "Max", page = 1, limit = 500 }) => ({
        url: `/funds/${encodeURIComponent(identifier)}`,
        params: { period, page, limit },
      }),
      providesTags: (result, error, { identifier }) => [
        { type: "FundPrice", id: identifier },
      ],
      transformResponse: (response) => {
        if (response.success && response.data) {
          const prices = (response.data.prices || []).sort(
            (a, b) => new Date(a.date) - new Date(b.date),
          );
          return {
            ...response.data,
            prices,
          };
        }
        return { prices: [], pagination: {} };
      },
    }),

    // GET /funds/{id}/price/{date} — most recent NAV on or before date
    getFundPriceByDate: builder.query({
      query: ({ id, date }) => `/funds/${id}/price/${date}`,
      transformResponse: (response) => {
        if (response.success && response.data) return response.data;
        return null;
      },
    }),

    // GET /funds/compare?fund_ids=1,2,3&from_date=&to_date=
    compareFunds: builder.query({
      query: ({ fundIds, fromDate, toDate }) => ({
        url: "/funds/compare",
        params: {
          fund_ids: fundIds.join(","),
          from_date: fromDate,
          ...(toDate ? { to_date: toDate } : {}),
        },
      }),
      transformResponse: (response) => {
        if (response.success && response.data) return response.data;
        return { funds: [], from_date: null, to_date: null };
      },
    }),

    // GET /funds/performance — weekly/monthly/YTD returns for all active funds
    getFundsPerformance: builder.query({
      query: () => "/funds/performance",
      providesTags: ["FundList"],
      transformResponse: (response) => {
        if (response.success && response.data?.funds)
          return response.data.funds;
        return [];
      },
    }),

    // POST /funds/import/all — trigger background price refresh for all fund managers
    importFunds: builder.mutation({
      query: () => ({ url: "/funds/import/all", method: "POST" }),
      invalidatesTags: ["FundList", "FundPrice", "Fund"],
    }),
  }),
});

export const {
  useGetFundsQuery,
  useCompareFundsQuery,
  useGetFundsPerformanceQuery,
  useGetFundBySymbolQuery,
  useGetFundPricesQuery,
  useGetFundPriceByDateQuery,
  useGetFundsInfoQuery,
  useImportFundsMutation,
} = fundsApi;
