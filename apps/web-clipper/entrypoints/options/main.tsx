import { createRoot } from "react-dom/client";
import "@app/design-system/styles/_global.scss";
import { PairingPanel } from "../../src/components/PairingPanel";
import { TemplatesPanel } from "../../src/components/TemplatesPanel";
import { HighlighterPanel } from "../../src/components/HighlighterPanel";
import { useHighlightingSettings } from "../../src/highlighter/useHighlightingSettings";
import { usePairingSettings } from "../../src/pairing/usePairingSettings";
import { useTemplateLibrary } from "../../src/templates/useTemplateLibrary";

function OptionsPage() {
  return (
    <>
      <PairingPanel controller={usePairingSettings()} />
      <TemplatesPanel controller={useTemplateLibrary()} />
      <HighlighterPanel controller={useHighlightingSettings()} />
    </>
  );
}

const container = document.getElementById("root");
if (container === null) {
  throw new Error("The options root element is missing from index.html.");
}

createRoot(container).render(<OptionsPage />);
