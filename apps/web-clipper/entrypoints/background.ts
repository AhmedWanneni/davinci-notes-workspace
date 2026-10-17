import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import type { HighlightRecord } from "../src/highlighter/HighlightRecord";
import { saveHighlight } from "../src/highlighter/highlightStore";
import type { StorageArea } from "../src/storage/storageArea";

const MENU_CLIP_PAGE = "davinci-clipper-clip-page";
const MENU_CLIP_SELECTION = "davinci-clipper-clip-selection";
const MENU_HIGHLIGHT_SELECTION = "davinci-clipper-highlight-selection";

function area(): StorageArea {
  return browser.storage.local as unknown as StorageArea;
}

/**
 * The background script holds no page content and runs no extraction: extraction
 * needs a DOM, so it happens in the popup (an extension page). The background
 * only creates the context menus and opens the popup.
 *
 * `action.openPopup()` requires Chrome 127+ (see `minimum_chrome_version`). If it
 * is unavailable the user can still click the toolbar icon; the shortcut
 * (`_execute_action`) is registered in the manifest and needs no code.
 */
export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
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
});

async function saveSelectionHighlight(tabId: number): Promise<void> {
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
  const record: HighlightRecord = {
    id: crypto.randomUUID(),
    url: (await browser.tabs.get(tabId)).url ?? "",
    text: anchor.text,
    occurrence: anchor.occurrence,
    createdAt: new Date().toISOString(),
  };
  await saveHighlight(area(), record);
  void browser.tabs
    .sendMessage(tabId, { type: "davinci:restore-highlights" })
    .catch(() => undefined);
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
