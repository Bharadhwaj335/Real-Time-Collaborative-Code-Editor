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
          position="top-center"
          toastOptions={{
            duration: 4000,
            className: "!bg-[#252526] !text-slate-100 !border !border-[#3c3c3c] !rounded-xl !shadow-xl",
            style: { fontSize: "0.875rem" },
            success: { iconTheme: { primary: "#4ec9b0", secondary: "#1e1e1e" } },
            error: { iconTheme: { primary: "#f44747", secondary: "#1e1e1e" } }
          }}
        />
        <App />
      </SocketProvider>
    </LoadingProvider>
  </ErrorBoundary>
);
