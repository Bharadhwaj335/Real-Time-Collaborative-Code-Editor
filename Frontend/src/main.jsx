import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { SocketProvider } from "./context/SocketContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <SocketProvider>
      <Toaster position="top-center" />
      <App />
    </SocketProvider>
  </ErrorBoundary>
);
