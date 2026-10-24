import { browser } from "wxt/browser";
import type { StorageArea } from "../storage/storageArea";
import type { PageCapture } from "../capture/readPage";
import { readPage } from "../capture/readPage";
import { parsePageHtml } from "../page/parsePageHtml";
import { prepareClipContext } from "./prepareClipContext";
import { renderClipPayload } from "./renderClipPayload";
import { loadTemplates } from "../templates/templateStore";
import { readSchemaOrg } from "../page/readSchemaOrg";
import { matchTemplate } from "@app/clipper-core";
import { loadPairing } from "../pairing/pairingStore";
import type { ClipFetch } from "../transport/postClipToDesktop";
import { postClipToDesktop } from "../transport/postClipToDesktop";
import { enqueueClip } from "../queue/clipQueue";

export interface QuickClipResult {
  success: boolean;
  reason?: string;
  queued?: boolean;
  delivered?: boolean;
  path?: string;
}

export function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("moz-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("view-source:")
  );
}

/**
 * Executes a headless quick-clip on an active tab without opening the popup UI.
 *
 * If the desktop app is unreachable or busy, automatically enqueues the clip
 * for background delivery on the next app launch (ADR-0178).
 * Fails gracefully without throwing on restricted/CSP pages.
 */
export async function quickClipTab(
  tab: { id?: number; url?: string; title?: string },
  storage: StorageArea,
  fetchImpl: ClipFetch = fetch as unknown as ClipFetch,
): Promise<QuickClipResult> {
  if (!tab.id || isRestrictedUrl(tab.url)) {
    return { success: false, reason: "restricted-url" };
  }

  let capture: PageCapture;
  try {
    const [execution] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: readPage,
    });
    const result = execution?.result;
    if (!result || typeof result !== "object" || !("html" in result)) {
      return { success: false, reason: "empty-page" };
    }
    capture = result as PageCapture;
  } catch (err) {
    console.warn("[clipper] quick-clip injection failed:", err);
    return { success: false, reason: "injection-failed" };
  }

  try {
    const pageUrl = capture.url || tab.url!;
    const doc = parsePageHtml(capture.html, pageUrl);
    const clipContext = prepareClipContext({
      capture,
      doc,
      mode: "full",
      now: new Date(),
    });

    const library = await loadTemplates(storage);
    const schemaTypes = Array.from(readSchemaOrg(doc).byType.keys());
    const matched =
      matchTemplate(library, { url: pageUrl, schemaTypes }) ?? library[0];

    if (!matched) {
      return { success: false, reason: "no-template" };
    }

    const { payload } = renderClipPayload(clipContext, matched, {
      clipId: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),
    });

    const pairing = await loadPairing(storage);
    const delivery = await postClipToDesktop(pairing, payload, fetchImpl);

    if (delivery.delivered) {
      return { success: true, delivered: true, path: delivery.path };
    }

    if (delivery.reason === "duplicate") {
      return { success: true, delivered: false, reason: "duplicate" };
    }

    await enqueueClip(storage, payload);
    return {
      success: true,
      delivered: false,
      queued: true,
      reason: delivery.reason,
    };
  } catch (error) {
    console.error("[clipper] quick-clip processing failed:", error);
    return { success: false, reason: "processing-failed" };
  }
}
