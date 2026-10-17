import { browser } from "wxt/browser";
import type { ClipTemplate } from "@app/clipper-core";
import { readActiveTabCapture } from "../capture/readActiveTabCapture";
import type { PageCapture } from "../capture/readPage";
import { downloadNoteFile } from "../clip/downloadNoteFile";
import { newClipId } from "../clip/newClipId";
import { loadTemplates, type StorageArea } from "../templates/templateStore";

/**
 * Everything the clip session needs from outside itself.
 *
 * Passed in rather than imported directly so the session can be driven in tests
 * without mocking the `wxt/browser` module, and so Phase 3 can swap `saveNote`
 * for the desktop transport without touching the popup.
 */
export interface ClipSessionDeps {
  readCapture(): Promise<PageCapture>;
  loadTemplates(): Promise<ClipTemplate[]>;
  /** Saves the note as a file. Phase 3 adds the direct-to-desktop path. */
  saveNote(path: string, content: string): Promise<void>;
  now(): Date;
  newClipId(): string;
}

export const defaultClipSessionDeps: ClipSessionDeps = {
  readCapture: readActiveTabCapture,
  loadTemplates: () =>
    loadTemplates(browser.storage.local as unknown as StorageArea),
  saveNote: (path, content) =>
    downloadNoteFile(browser.downloads, path, content),
  now: () => new Date(),
  newClipId,
};
