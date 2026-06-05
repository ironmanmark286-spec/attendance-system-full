import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Website ke Browser Tab par dikhne wala naam (Title) set kar rahe hain
document.title = "PulseHR - Workspace";

createRoot(document.getElementById("root")).render(<App />);
