// features/api/bondsApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";

export const bondsApi = createApi({
  reducerPath: "bondsApi",
  baseQuery,
  tagTypes: ["Bonds"],
  endpoints: (builder) => ({
    getBonds: builder.query({
      query: () => "/bonds?limit=1000", // Fetch enough to populate search
      transformResponse: (response) => response.data?.bonds || [],
      providesTags: ["Bonds"],
    }),
    getBondById: builder.query({
      query: (bondId) => `/bonds/${bondId}`,
    }),
  }),
});

export const {
  useGetBondsQuery,
  useGetBondByIdQuery,
} = bondsApi;