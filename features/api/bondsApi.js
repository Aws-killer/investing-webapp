import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const bondsApi = createApi({
  reducerPath: "bondsApi",
  baseQuery,
  endpoints: (builder) => ({
    getBonds: builder.query({
      query: () => "/bonds",
    }),
    getBondById: builder.query({
      query: (bondId) => `/bonds/${bondId}`,
    }),
    getBondYields: builder.query({
      query: (bondId) => `/bonds/${bondId}/yields`,
    }),
    addBondToPortfolio: builder.mutation({
      query: ({ portfolioId, bondData }) => ({
        url: `/portfolios/${portfolioId}/bonds`,
        method: "POST",
        body: bondData,
      }),
    }),
  }),
});

export const {
  useGetBondsQuery,
  useGetBondByIdQuery,
  useGetBondYieldsQuery,
  useAddBondToPortfolioMutation,
} = bondsApi;
