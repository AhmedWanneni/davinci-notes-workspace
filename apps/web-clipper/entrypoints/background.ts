import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import type { HighlightRecord } from "../src/highlighter/HighlightRecord";
import { saveHighlight } from "../src/highlighter/highlightStore";
import type { StorageArea } from "../src/storage/storageArea";
import { drainQueue } from "../src/queue/clipQueue";
import { loadPairing } from "../src/pairing/pairingStore";
import { quickClipTab } from "../src/clip/quickClipTab";
import type { ClipFetch } from "../src/transport/postClipToDesktop";

const MENU_CLIP_PAGE = "davinci-clipper-clip-page";
const MENU_CLIP_SELECTION = "davinci-clipper-clip-selection";
const MENU_HIGHLIGHT_SELECTION = "davinci-clipper-highlight-selection";

function area(): StorageArea {
  return browser.storage.local as unknown as StorageArea;
}

async function triggerQueueDrain(): Promise<void> {
  try {
    const storage = area();
    const pairing = await loadPairing(storage);
    if (!pairing) return;
    await drainQueue(storage, pairing, fetch as unknown as ClipFetch);
  } catch (err) {
    console.warn("[clipper] background queue drain failed:", err);
  }
}

/**
 * Service worker lifecycle for Web Clipper (Phase 7).
 *
 * Handles context menus, keyboard shortcuts (Alt+Shift+C, Alt+Shift+S, Alt+Shift+H),
 * and event-driven offline queue drain on browser startup and install. Zero timers.
 */
export default defineBackground(() => {
  browser.runtime.onStartup?.addListener(() => {
    void triggerQueueDrain();
  });

  browser.runtime.onInstalled.addListener(() => {
    void triggerQueueDrain();
    browser.contextMenus.removeAll(() => {
      browser.contextMenus.create({
        id: MENU_CLIP_PAGE,
        title: "Clip page to DaVinci Notes",
        contexts: ["page", "frame"],
      });
      browser.contextMenus.create({
        id: MENU_HIGHLIGHT_SELECTION,
        title: "Highlight for DaVinci Notes",
        contexts: ["selection"],
      });
      browser.contextMenus.create({
        id: MENU_CLIP_SELECTION,
        title: "Clip selection to DaVinci Notes",
        contexts: ["selection"],
      });
    });
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (tab?.id === undefined) return;
    if (info.menuItemId === MENU_HIGHLIGHT_SELECTION) {
      void saveSelectionHighlight(tab.id);
      return;
    }
    void openPopup();
  });

  browser.commands?.onCommand?.addListener(async (command) => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;

      if (command === "toggle_highlighter") {
        void saveSelectionHighlight(tab.id);
      } else if (command === "quick_clip") {
        void quickClipTab(tab, area());
      }
    } catch (err) {
      console.warn("[clipper] command dispatch failed:", err);
    }
  });
});

async function saveSelectionHighlight(tabId: number): Promise<void> {
  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId },
      func: () => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() ?? "";
        if (!selection || selection.rangeCount === 0 || text.length === 0)
          return undefined;
        const range = selection.getRangeAt(0);
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        const nodes: Text[] = [];
        for (
          let node = walker.nextNode();
          node !== null;
          node = walker.nextNode()
        )
          nodes.push(node as Text);
        const source = nodes.map((node) => node.data).join("");
        let offset = 0;
        for (const node of nodes) {
          if (node === range.startContainer) {
            offset += range.startOffset;
            break;
          }
          offset += node.data.length;
        }
        let occurrence = 0;
        for (
          let index = source.indexOf(text);
          index >= 0 && index < offset;
          index = source.indexOf(text, index + text.length)
        )
          occurrence += 1;
        return { text: text.slice(0, 2000), occurrence };
      },
    });
    const anchor = result?.result;
    if (!anchor) return;
    const tab = await browser.tabs.get(tabId);
    const record: HighlightRecord = {
      id: crypto.randomUUID(),
      url: tab.url ?? "",
      text: anchor.text,
      occurrence: anchor.occurrence,
      createdAt: new Date().toISOString(),
    };
    await saveHighlight(area(), record);
    void browser.tabs
      .sendMessage(tabId, { type: "davinci:restore-highlights" })
      .catch(() => undefined);
  } catch (error) {
    console.warn("[clipper] highlight selection failed:", error);
  }
}

async function openPopup(): Promise<void> {
  const action = browser.action as unknown as {
    openPopup?: () => Promise<void>;
  };
  try {
    await action.openPopup?.();
  } catch {
    // Older Chromium or a non-user-gesture call: the toolbar icon still works.
  }
}
