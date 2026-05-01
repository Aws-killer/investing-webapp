import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseApi";
import { setCredentials, logout } from "../slices/authSlice";

const mapUser = (data) => ({
  id: data.id,
  username: data.username,
  email: data.email,
  display_name: data.display_name,
  phone_number: data.phone_number,
  location: data.location,
  bio: data.bio,
  authenticator_enabled: data.authenticator_enabled,
  authenticator_login_enabled: data.authenticator_login_enabled,
  require_authenticator_for_password_login: data.require_authenticator_for_password_login,
});

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery,
  tagTypes: ["CurrentUser"],
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
              user: mapUser(data.data),
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
              user: mapUser(data.data),
              token: data.data.token,
            })
          );
        } catch (err) {
          // Handle error if needed
        }
      },
    }),
    authenticatorLogin: builder.mutation({
      query: (credentials) => ({
        url: "/users/login/authenticator",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: mapUser(data.data),
              token: data.data.token,
            })
          );
        } catch (err) {
          // Handled by the calling component.
        }
      },
    }),
    getMe: builder.query({
      query: () => "/users/me",
      providesTags: ["CurrentUser"],
      transformResponse: (response) => response.data,
    }),
    updateMe: builder.mutation({
      query: (profile) => ({
        url: "/users/me",
        method: "PUT",
        body: profile,
      }),
      invalidatesTags: ["CurrentUser"],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          const token = getState().auth?.token;
          dispatch(setCredentials({ user: mapUser(data.data), token }));
        } catch (err) {
          // Handled by the calling component.
        }
      },
    }),
    requestPasswordReset: builder.mutation({
      query: (payload) => ({
        url: "/users/forgot-password/request",
        method: "POST",
        body: payload,
      }),
    }),
    resetPassword: builder.mutation({
      query: (payload) => ({
        url: "/users/forgot-password/reset",
        method: "POST",
        body: payload,
      }),
    }),
    setupAuthenticator: builder.mutation({
      query: () => ({
        url: "/users/authenticator/setup",
        method: "POST",
      }),
    }),
    verifyAuthenticator: builder.mutation({
      query: (payload) => ({
        url: "/users/authenticator/verify",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["CurrentUser"],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          const token = getState().auth?.token;
          dispatch(setCredentials({ user: mapUser(data.data), token }));
        } catch (err) {
          // Handled by the calling component.
        }
      },
    }),
    disableAuthenticator: builder.mutation({
      query: () => ({
        url: "/users/authenticator",
        method: "DELETE",
      }),
      invalidatesTags: ["CurrentUser"],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          const token = getState().auth?.token;
          dispatch(setCredentials({ user: mapUser(data.data), token }));
        } catch (err) {
          // Handled by the calling component.
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
  useAuthenticatorLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useSetupAuthenticatorMutation,
  useVerifyAuthenticatorMutation,
  useDisableAuthenticatorMutation,
  useGetWatchlistQuery,
  useUpdateWatchlistMutation,
} = usersApi;
