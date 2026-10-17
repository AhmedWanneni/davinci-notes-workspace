import { browser } from "wxt/browser";
import type { ClipPayload, ClipTemplate } from "@app/clipper-core";
import { readActiveTabCapture } from "../capture/readActiveTabCapture";
import type { PageCapture } from "../capture/readPage";
import { downloadNoteFile } from "../clip/downloadNoteFile";
import { newClipId } from "../clip/newClipId";
import { loadPairing, type ClipperPairing } from "../pairing/pairingStore";
import type { StorageArea } from "../storage/storageArea";
import { loadTemplates } from "../templates/templateStore";
import {
  postClipToDesktop,
  type ClipDelivery,
} from "../transport/postClipToDesktop";

/**
 * Everything the clip session needs from outside itself.
 *
 * Passed in rather than imported directly so the session can be driven in tests
 * without mocking the `wxt/browser` module, and so the popup never learns how a
 * clip travels.
 */
export interface ClipSessionDeps {
  readCapture(): Promise<PageCapture>;
  loadTemplates(): Promise<ClipTemplate[]>;
  /** The stored pairing, or `undefined` when the extension is not paired. */
  loadPairing(): Promise<ClipperPairing | undefined>;
  /** Export the note as a `.md` download. */
  saveNoteFile(path: string, content: string): Promise<void>;
  /** Send the clip to the app; never throws (see `postClipToDesktop`). */
  sendClip(payload: ClipPayload): Promise<ClipDelivery>;
  openOptionsPage(): void;
  now(): Date;
  newClipId(): string;
}

function area(): StorageArea {
  return browser.storage.local as unknown as StorageArea;
}

export const defaultClipSessionDeps: ClipSessionDeps = {
  readCapture: readActiveTabCapture,
  loadTemplates: () => loadTemplates(area()),
  loadPairing: () => loadPairing(area()),
  saveNoteFile: (path, content) =>
    downloadNoteFile(browser.downloads, path, content),
  sendClip: async (payload) =>
    postClipToDesktop(await loadPairing(area()), payload, (url, init) =>
      // Called on the global on purpose: invoking a bare reference to `fetch`
      // loses its receiver and throws "Illegal invocation" in a browser.
      globalThis.fetch(url, init),
    ),
  openOptionsPage: () => {
    void browser.runtime.openOptionsPage();
  },
  now: () => new Date(),
  newClipId,
};
