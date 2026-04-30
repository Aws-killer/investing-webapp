import { createSlice } from "@reduxjs/toolkit";

const BLANK_STATE = { user: null, token: null, isAuthenticated: false };

// Load initial state from localStorage or use default values
const loadState = () => {
  if (typeof window === "undefined") return BLANK_STATE;
  try {
    const serializedState = localStorage.getItem("authState");
    return serializedState ? JSON.parse(serializedState) : BLANK_STATE;
  } catch {
    return BLANK_STATE;
  }
};

const initialState = loadState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, { payload: { user, token } }) => {
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("authState", JSON.stringify({ user, token, isAuthenticated: true }));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("authState");
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
