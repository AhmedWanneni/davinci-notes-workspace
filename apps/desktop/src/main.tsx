import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@app/design-system";
import {
  createWebPlatformAdapters,
  setPlatformAdapters,
} from "@app/platform-adapters";
import "@app/design-system/styles/_global.scss";
import "./styles/_main.scss";
import { createDesktopPlatformAdapters } from "./adapters";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { App } from "./App";

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

setPlatformAdapters(
  isTauri ? createDesktopPlatformAdapters() : createWebPlatformAdapters(),
);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <App />
      </TooltipProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
