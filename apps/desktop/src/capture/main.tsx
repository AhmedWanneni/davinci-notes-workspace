import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@app/design-system/styles/_global.scss";
import { QuickCapture } from "../components/QuickCapture";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <QuickCapture />
  </StrictMode>,
);
