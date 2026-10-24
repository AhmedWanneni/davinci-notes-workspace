import { browser } from "wxt/browser";
import type { ClipTemplate } from "@app/clipper-core";
import type { StorageArea } from "../storage/storageArea";
import { loadTemplates, saveTemplates } from "./templateStore";

/**
 * Everything the template library needs from the extension.
 *
 * Passed in rather than imported directly so the panel can be driven in tests
 * without mocking `wxt/browser` — the same seam the clip session and the pairing
 * settings use, for the same reason.
 */
export interface TemplateLibraryDeps {
  load(): Promise<ClipTemplate[]>;
  save(templates: readonly ClipTemplate[]): Promise<void>;
  /** An id for a template the user creates; unique, and never re-derived. */
  newTemplateId(): string;
}

function area(): StorageArea {
  return browser.storage.local as unknown as StorageArea;
}

export const defaultTemplateLibraryDeps: TemplateLibraryDeps = {
  load: () => loadTemplates(area()),
  save: (templates) => saveTemplates(area(), templates),
  newTemplateId: () => `template-${crypto.randomUUID()}`,
};
