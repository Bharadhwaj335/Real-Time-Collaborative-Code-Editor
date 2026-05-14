import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { SocketProvider } from "./context/SocketContext";
import { LoadingProvider } from "./context/LoadingContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import OfflineBanner from "./components/Common/OfflineBanner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <LoadingProvider>
      <SocketProvider>
        <OfflineBanner />
        <Toaster
          position="bottom-center"
          containerStyle={{ bottom: 20 }}
          toastOptions={{
            duration: 3600,
            className:
              "!bg-[#1a1a1c] !text-slate-100 !text-[13px] !font-medium !px-4 !py-3 !rounded-xl !border !border-white/[0.08] !shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
            style: {
              maxWidth: "min(420px, calc(100vw - 32px))"
            },
            success: {
              iconTheme: { primary: "#4ec9b0", secondary: "#141416" }
            },
            error: {
              iconTheme: { primary: "#f44747", secondary: "#141416" }
            }
          }}
        />
        <App />
      </SocketProvider>
    </LoadingProvider>
  </ErrorBoundary>
);
