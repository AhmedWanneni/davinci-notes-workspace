import { describe, expect, it, vi, beforeEach } from "vitest";
import { loadAgentPreferences, saveAgentPreference } from "./agentPreferences";

const mockGetSetting = vi.fn();
const mockSetSetting = vi.fn();

vi.mock("../../vault/sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  withDbLock: (fn: () => unknown) => fn(),
}));

vi.mock("../../vault/settingsCommands", () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  setSetting: (...args: unknown[]) => mockSetSetting(...args),
}));

describe("agentPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads defaults when settings are absent", async () => {
    mockGetSetting.mockResolvedValue(null);
    const prefs = await loadAgentPreferences();
    expect(prefs).toEqual({
      autoApply: true,
      webSearchEnabled: true,
      rewriteEnabled: true,
    });
  });

  it("loads stored values when set in database", async () => {
    mockGetSetting.mockImplementation((_db, key) => {
      if (key === "ai.agent.autoApply") return Promise.resolve("false");
      if (key === "ai.agent.webSearchEnabled") return Promise.resolve("false");
      if (key === "ai.agent.rewriteEnabled") return Promise.resolve("false");
      return Promise.resolve(null);
    });

    const prefs = await loadAgentPreferences();
    expect(prefs).toEqual({
      autoApply: false,
      webSearchEnabled: false,
      rewriteEnabled: false,
    });
  });

  it("saves autoApply, webSearchEnabled, and rewriteEnabled preferences to sqlite", async () => {
    await saveAgentPreference("autoApply", true);
    expect(mockSetSetting).toHaveBeenCalledWith(
      {},
      "ai.agent.autoApply",
      "true",
    );

    await saveAgentPreference("webSearchEnabled", false);
    expect(mockSetSetting).toHaveBeenCalledWith(
      {},
      "ai.agent.webSearchEnabled",
      "false",
    );

    await saveAgentPreference("rewriteEnabled", true);
    expect(mockSetSetting).toHaveBeenCalledWith(
      {},
      "ai.agent.rewriteEnabled",
      "true",
    );
  });
});
