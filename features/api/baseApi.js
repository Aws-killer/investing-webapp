import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthHeader } from "../utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://mbonea-investingtest.hf.space";

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Prefer token from Redux state (set on login)
    const token = getState().auth?.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
      return headers;
    }

    // Fallback: token stored directly in localStorage by auth utility
    const authHeaders = getAuthHeader();
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return headers;
  },
});

export const baseQuery = async (args, api, extraOptions) => {
  const result = await baseQueryWithAuth(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token expired or invalid — could dispatch logout here if needed
  }

  return result;
};
