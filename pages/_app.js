import "@/styles/globals.css";
import { Provider } from "react-redux";
import { store, persistor } from "@/features/store";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "@/components/ui/sonner";
import { Libre_Baskerville } from "next/font/google";
import "../styles/globals.css";
import { CurrencyProvider } from "@/Providers/CurrencyProvider";
import { AppNavbar } from "@/components/AppNavbar";

// const geist = Libre_Baskerville({
//   weight: ["400", "700"],
// });
export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CurrencyProvider>
          <AppNavbar />
          <Component {...pageProps} />
          <Toaster />
        </CurrencyProvider>
      </PersistGate>
    </Provider>
  );
}
