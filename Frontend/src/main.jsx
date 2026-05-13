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
        <Toaster position="top-center" />
        <App />
      </SocketProvider>
    </LoadingProvider>
  </ErrorBoundary>
);
