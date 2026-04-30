import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";
import { setCredentials, logout } from "../slices/authSlice";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log("Login successful: setttttt ", data);
          dispatch(
            setCredentials({
              user: {
                id: data.data.id,
                username: data.data.username,
                email: data.data.email,
              },
              token: data.data.token,
            })
          );
        } catch (err) {
          // Handle error if needed
        }
      },
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/users/register",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: {
                id: data.data.id,
                username: data.data.username,
                email: data.data.email,
              },
              token: data.data.token,
            })
          );
        } catch (err) {
          // Handle error if needed
        }
      },
    }),
    getWatchlist: builder.query({
      query: () => `/users/watchlist`,
    }),
    updateWatchlist: builder.mutation({
      query: (update) => ({
        url: `/users/watchlist`,
        method: "PUT",
        body: update,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetWatchlistQuery,
  useUpdateWatchlistMutation,
} = usersApi;
