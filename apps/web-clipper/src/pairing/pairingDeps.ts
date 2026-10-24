import { browser } from "wxt/browser";
import type { StorageArea } from "../storage/storageArea";
import {
  clearPairing,
  loadPairing,
  savePairing,
  type ClipperPairing,
} from "./pairingStore";

/**
 * Everything the pairing panel needs from the browser.
 *
 * Passed in rather than imported directly so the panel can be driven in tests
 * without mocking the `wxt/browser` module — the same seam the clip session
 * uses, for the same reason.
 */
export interface PairingDeps {
  load(): Promise<ClipperPairing | undefined>;
  save(pairing: ClipperPairing): Promise<void>;
  clear(): Promise<void>;
  loadQueueCount?(): Promise<number>;
  drainQueue?(): Promise<import("../queue/clipQueue.js").DrainSummary>;
  clearQueue?(): Promise<void>;
}

function area(): StorageArea {
  return browser.storage.local as unknown as StorageArea;
}

export const defaultPairingDeps: PairingDeps = {
  load: () => loadPairing(area()),
  save: (pairing) => savePairing(area(), pairing),
  clear: () => clearPairing(area()),
  loadQueueCount: async () => {
    const { loadQueuedClips } = await import("../queue/clipQueue");
    return (await loadQueuedClips(area())).length;
  },
  drainQueue: async () => {
    const { drainQueue } = await import("../queue/clipQueue");
    return drainQueue(area(), await loadPairing(area()));
  },
  clearQueue: async () => {
    const { clearQueue } = await import("../queue/clipQueue");
    await clearQueue(area());
  },
};
