import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

const MENU_CLIP_PAGE = "davinci-clipper-clip-page";
const MENU_CLIP_SELECTION = "davinci-clipper-clip-selection";

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
        id: MENU_CLIP_SELECTION,
        title: "Clip selection to DaVinci Notes",
        contexts: ["selection"],
      });
    });
  });

  browser.contextMenus.onClicked.addListener((_info, tab) => {
    if (tab?.id === undefined) return;
    void openPopup();
  });
});

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
