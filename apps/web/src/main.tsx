import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@app/design-system";
import {
  createWebPlatformAdapters,
  setPlatformAdapters,
} from "@app/platform-adapters";
import "@app/design-system/styles/_global.scss";
import "../../desktop/src/styles/_main.scss";
import { App } from "../../desktop/src/App";

function bootstrapWebApp() {
  setPlatformAdapters(createWebPlatformAdapters());

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js");
    });
  }

  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Missing #root mount element.");
  }

  createRoot(container).render(
    <StrictMode>
      <TooltipProvider delayDuration={300}>
        <App />
      </TooltipProvider>
    </StrictMode>,
  );
}

bootstrapWebApp();
