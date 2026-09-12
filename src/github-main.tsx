import React from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import BudgetApp from "./components/BudgetApp";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <BudgetApp />
  </React.StrictMode>
);