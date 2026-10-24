import { browser } from "wxt/browser";
import type { PageCapture } from "./readPage";
import { readPage } from "./readPage";

/**
 * Read the page the user invoked the clipper on.
 *
 * `activeTab` grants access to the active tab only for the duration of the user's
 * invocation, and `scripting` runs `readPage` there. No content script is
 * registered, so a page that is browsed but never clipped is never touched, and
 * no host permission is requested.
 *
 * Reads that Chrome forbids (browser settings pages, the Web Store, some local
 * files) reject rather than returning nothing — the caller turns that into a
 * visible error instead of an empty note.
 */
export async function readActiveTabCapture(): Promise<PageCapture> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) {
    throw new Error("No active tab to clip.");
  }

  const results = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: readPage,
  });

  const capture = results[0]?.result;
  if (!capture) {
    throw new Error("This page could not be read.");
  }
  return capture;
}
