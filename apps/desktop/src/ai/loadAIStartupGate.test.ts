import { describe, expect, it, vi } from "vitest";

const { getSetting } = vi.hoisted(() => ({ getSetting: vi.fn() }));
vi.mock("../vault", () => ({
  getVaultIndexDb: vi.fn(async () => ({})),
  getSetting,
  withDbLock: async (work: () => Promise<unknown>) => work(),
}));

import { loadAIStartupGate } from "./loadAIStartupGate";

describe("loadAIStartupGate", () => {
  it("issues singleton-connection settings reads sequentially", async () => {
    let releaseProvider!: (value: string) => void;
    const provider = new Promise<string>((resolve) => { releaseProvider = resolve; });
    getSetting.mockReset()
      .mockReturnValueOnce(provider)
      .mockResolvedValueOnce("enabled")
      .mockResolvedValueOnce("ready");
    const loading = loadAIStartupGate();
    await Promise.resolve();
    expect(getSetting).toHaveBeenCalledTimes(1);
    releaseProvider("gemini");
    await expect(loading).resolves.toEqual({ cloudEnabled: true, providerId: "gemini", providerReady: true });
    expect(getSetting.mock.calls.map(([, key]) => key)).toEqual(["ai.provider.id", "ai.consent.cloud", "ai.provider.status.gemini"]);
  });
});
