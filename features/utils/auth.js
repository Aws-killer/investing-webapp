// Constants
const TOKEN_KEY = "uwekezaji_token";
const USER_ID_KEY = "uwekezaji_user_id";

// Token management
export const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// User ID management
export const setUserId = (userId) => {
  localStorage.setItem(USER_ID_KEY, userId);
};

export const getUserId = () => {
  return localStorage.getItem(USER_ID_KEY);
};

export const removeUserId = () => {
  localStorage.removeItem(USER_ID_KEY);
};

// Auth status
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Logout helper
export const logout = () => {
  removeAuthToken();
  removeUserId();
};

// Auth header generator for API calls
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
