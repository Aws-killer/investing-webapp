import "@/styles/globals.css";
import { Provider } from "react-redux";
import { store, persistor } from "@/features/store";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "@/components/ui/sonner";
import { Libre_Baskerville } from "next/font/google";
import { CurrencyProvider } from "@/features/context/currency-context";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { ThemeProvider } from "next-themes";

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <CurrencyProvider>
            <AppNavbar />
            <Component {...pageProps} />
            <Toaster />
          </CurrencyProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
