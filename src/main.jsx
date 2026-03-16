import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <Toaster position="top-center" />
    <App />
  </>
);
