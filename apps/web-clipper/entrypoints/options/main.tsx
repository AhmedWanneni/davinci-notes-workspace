import { createRoot } from "react-dom/client";
import "@app/design-system/styles/_global.scss";
import { PairingPanel } from "../../src/components/PairingPanel";
import { usePairingSettings } from "../../src/pairing/usePairingSettings";

function PairingPanelRoot() {
  return <PairingPanel controller={usePairingSettings()} />;
}

const container = document.getElementById("root");
if (container === null) {
  throw new Error("The options root element is missing from index.html.");
}

createRoot(container).render(<PairingPanelRoot />);
