import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthHeader } from "../utils/auth";

// Helper to inject additional query parameters (including user_id) into query params
const addUserIdToRequest = (args, { getState }) => {
  const state = getState();
  const userId = state.auth?.user?.id;
  // console.log("User ID from state:", userId);

  // Optional: extra arguments to be merged in
  let additionalParams = {};
  if (typeof args === "object" && args !== null && args.addedArgs) {
    additionalParams = { ...args.addedArgs };
    delete args.addedArgs;
  }

  // If it's a string (URL), append user_id & additional params
  if (typeof args === "string") {
    const separator = args.includes("?") ? "&" : "?";
    const queryParams = [];

    if (userId) {
      queryParams.push(`user_id=${userId}`);
    }

    Object.entries(additionalParams).forEach(([key, value]) => {
      queryParams.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      );
    });

    return queryParams.length
      ? `${args}${separator}${queryParams.join("&")}`
      : args;
  }

  // If it's an object with url property, merge into params
  if (typeof args === "object" && args !== null) {
    const params = new URLSearchParams(args.params || {});
    if (
      userId &&
      !args.url?.includes("login") &&
      !args.url?.includes("register")
    ) {
      params.append("user_id", userId.toString());
    }
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.append(key, value.toString());
    });
    return {
      ...args,
      params: params.toString(),
    };
  }

  return args;
};

// Create a wrapped baseQuery that injects user_id and handles auth
const baseQueryWithAuth = fetchBaseQuery({
  mode: "no-cors",
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    // Use auth token from state (if available)
    const token = getState().auth?.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    // Add any additional auth headers from our utility
    const authHeaders = getAuthHeader();
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Attempt to add CORS-related headers (note: may not work if server does not allow)
    headers.set("Origin", window.location.origin);
    headers.set("Access-Control-Allow-Origin", "*");

    return headers;
  },
});

export const baseQuery = async (args, api, extraOptions) => {
  // Inject user_id and any added args into query parameters if available
  // const adjustedArgs = addUserIdToRequest(args, api);
  const result = await baseQueryWithAuth(args, api, extraOptions);

  // Optional: handle 401 errors (e.g., token expired) here
  if (result.error && result.error.status === 401) {
    // Implement token refresh logic or other error handling as needed
  }

  return result;
};
