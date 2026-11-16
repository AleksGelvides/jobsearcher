import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { LiveApp } from "./app/LiveApp";
import { data } from "./mocks/data";
import "./styles.css";

const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <StrictMode>
      {import.meta.env.VITE_JOBPILOT_API === "live" ? (
        <LiveApp />
      ) : (
        <App data={data} firstRun />
      )}
    </StrictMode>,
  );
