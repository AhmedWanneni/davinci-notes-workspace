import { describe, expect, it } from "vitest";

import { VaultWatchCoordinator } from "./vaultWatchCoordinator";

describe("VaultWatchCoordinator", () => {
  it("processes batches when not suppressed", () => {
    const coordinator = new VaultWatchCoordinator();
    expect(coordinator.shouldProcessBatch()).toBe(true);
  });

  it("drops batches while suppression is active", () => {
    const coordinator = new VaultWatchCoordinator();
    coordinator.beginSuppression();
    expect(coordinator.shouldProcessBatch()).toBe(false);
    coordinator.endSuppression();
    expect(coordinator.shouldProcessBatch()).toBe(true);
  });

  it("supports nested suppression", () => {
    const coordinator = new VaultWatchCoordinator();
    coordinator.beginSuppression();
    coordinator.beginSuppression();
    coordinator.endSuppression();
    expect(coordinator.shouldProcessBatch()).toBe(false);
    coordinator.endSuppression();
    expect(coordinator.shouldProcessBatch()).toBe(true);
  });

  it("never goes below zero suppression depth", () => {
    const coordinator = new VaultWatchCoordinator();
    coordinator.endSuppression();
    expect(coordinator.suppressionDepth).toBe(0);
  });
});
