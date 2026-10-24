import { createRoot } from "react-dom/client";
import "@app/design-system/styles/_global.scss";
import { ClipPopup } from "../../src/components/ClipPopup";
import { useClipSession } from "../../src/popup/useClipSession";

function ClipPopupRoot() {
  return <ClipPopup controller={useClipSession()} />;
}

const container = document.getElementById("root");
if (container === null) {
  throw new Error("The popup root element is missing from index.html.");
}

// Deliberately not StrictMode: its development-only double invocation would read
// and extract the page twice, and a popup is a fresh document on every open, so
// the extra checks buy nothing here.
createRoot(container).render(<ClipPopupRoot />);
