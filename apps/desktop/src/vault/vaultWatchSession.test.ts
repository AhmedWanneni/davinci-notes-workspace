import { beforeEach, describe, expect, it, vi } from "vitest";

const setVaultWatcherPaused = vi.fn();
const startVaultWatcher = vi.fn();

vi.mock("./vaultCommands", () => ({
  setVaultWatcherPaused,
  startVaultWatcher,
}));

describe("vaultWatchSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setVaultWatcherPaused.mockResolvedValue(undefined);
    startVaultWatcher.mockResolvedValue(undefined);
  });

  it("pauses the watcher during suppressed work and resumes after settle", async () => {
    const { VAULT_WATCHER_SETTLE_MS } = await import("./vaultWatchCoordinator");
    const { withVaultWatchSuppressed } = await import("./vaultWatchSession");

    const work = vi.fn().mockResolvedValue("done");
    const resultPromise = withVaultWatchSuppressed(work);

    await vi.advanceTimersByTimeAsync(VAULT_WATCHER_SETTLE_MS);
    await expect(resultPromise).resolves.toBe("done");

    expect(work).toHaveBeenCalledOnce();
    expect(setVaultWatcherPaused).toHaveBeenCalledWith(true);
    expect(setVaultWatcherPaused).toHaveBeenLastCalledWith(false);
    expect(startVaultWatcher).not.toHaveBeenCalled();
  });

  it("starts the watcher paused, then resumes after settle", async () => {
    const { activateVaultWatcher } = await import("./vaultWatchSession");
    const { VAULT_WATCHER_SETTLE_MS } = await import("./vaultWatchCoordinator");

    const activatePromise = activateVaultWatcher();
    await vi.advanceTimersByTimeAsync(VAULT_WATCHER_SETTLE_MS);
    await activatePromise;

    expect(startVaultWatcher).toHaveBeenCalledOnce();
    expect(setVaultWatcherPaused).toHaveBeenNthCalledWith(1, true);
    expect(setVaultWatcherPaused).toHaveBeenLastCalledWith(false);
  });
});
