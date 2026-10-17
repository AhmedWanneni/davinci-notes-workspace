import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";
import type { StorageArea } from "../src/storage/storageArea";
import { loadHighlights } from "../src/highlighter/highlightStore";

function area(): StorageArea {
  return browser.storage.local as unknown as StorageArea;
}

async function restoreWhenIdle() {
  const records = await loadHighlights(area(), location.href);
  if (records.length === 0) return;
  const { restoreHighlights } =
    await import("../src/highlighter/pageHighlights");
  restoreHighlights(document, records);
}

export default defineContentScript({
  matches: ["*://*/*"],
  runAt: "document_idle",
  main() {
    const idle =
      window.requestIdleCallback ??
      ((callback: IdleRequestCallback) => window.setTimeout(callback, 0));
    idle(() => void restoreWhenIdle());
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === "davinci:restore-highlights")
        void restoreWhenIdle();
    });
  },
});
