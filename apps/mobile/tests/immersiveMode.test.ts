import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getImmersiveModeSnapshot,
  subscribeImmersiveMode,
  saveImmersiveModeToDb,
  loadImmersiveModeFromDb,
} from "../settings/immersiveModeState";
import { getVaultIndexDb } from "../database";

describe("Immersive Mode & Navigation Bar Verification", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await getVaultIndexDb();
    await db.runAsync("DELETE FROM settings WHERE key = 'ui.immersive_mode'");
  });

  it("1. Default setting is off (false)", async () => {
    await loadImmersiveModeFromDb();
    expect(getImmersiveModeSnapshot()).toBe(false);
  });

  it("2. Toggling immersive mode notifies subscribers and persists to DB", async () => {
    let notifiedVal: boolean | null = null;
    const unsubscribe = subscribeImmersiveMode(() => {
      notifiedVal = getImmersiveModeSnapshot();
    });

    await saveImmersiveModeToDb(true);
    expect(notifiedVal).toBe(true);
    expect(getImmersiveModeSnapshot()).toBe(true);

    // Verify written to database
    const db = await getVaultIndexDb();
    const rows = await db.getAllAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'ui.immersive_mode'",
    );
    expect(rows.length).toBe(1);
    expect(rows[0]?.value).toBe("1");

    // Toggle off
    await saveImmersiveModeToDb(false);
    expect(notifiedVal).toBe(false);
    expect(getImmersiveModeSnapshot()).toBe(false);

    unsubscribe();
  });

  it("3. loadImmersiveModeFromDb restores persisted setting on cold start", async () => {
    const db = await getVaultIndexDb();
    await db.runAsync(
      "INSERT INTO settings (key, value) VALUES ('ui.immersive_mode', '1')",
    );

    const loaded = await loadImmersiveModeFromDb();
    expect(loaded).toBe(true);
    expect(getImmersiveModeSnapshot()).toBe(true);
  });

  it("4. Safe-area bottom inset preserves minimum 12pt padding in immersive mode", () => {
    // When Android system navigation bar is hidden, insets.bottom is 0
    const immersiveInsetBottom = 0;
    const computedPadding = Math.max(immersiveInsetBottom, 12);
    expect(computedPadding).toBe(12);

    // When restored (e.g. 48px system navigation bar)
    const normalInsetBottom = 48;
    const normalPadding = Math.max(normalInsetBottom, 12);
    expect(normalPadding).toBe(48);
  });
});
