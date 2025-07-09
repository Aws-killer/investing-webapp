import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { stocksApi } from "./api/stocksApi";
import { portfoliosApi } from "./api/portfoliosApi";
import { usersApi } from "./api/usersApi";
import { uttApi } from "./api/uttApi";
import { bondsApi } from "./api/bondsApi";
import authReducer from "./slices/authSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist auth state
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    [stocksApi.reducerPath]: stocksApi.reducer,
    [portfoliosApi.reducerPath]: portfoliosApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [uttApi.reducerPath]: uttApi.reducer,
    [bondsApi.reducerPath]: bondsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(stocksApi.middleware)
      .concat(portfoliosApi.middleware)
      .concat(usersApi.middleware)
      .concat(uttApi.middleware)
      .concat(bondsApi.middleware),
});

// Enable refetchOnFocus and refetchOnReconnect
setupListeners(store.dispatch);

export const persistor = persistStore(store);
export default store;
