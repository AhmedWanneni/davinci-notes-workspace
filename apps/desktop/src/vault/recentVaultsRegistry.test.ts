import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  getRecentVaults,
  recordRecentVault,
  removeRecentVault,
  checkVaultExists,
  getAutoOpenVault,
} from "./recentVaultsRegistry";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("recentVaultsRegistry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls get_recent_vaults", async () => {
    const mockList = [
      { path: "/vaults/a", name: "a", lastOpenedAt: 100, exists: true },
    ];
    vi.mocked(invoke).mockResolvedValueOnce(mockList);

    const result = await getRecentVaults();
    expect(invoke).toHaveBeenCalledWith("get_recent_vaults");
    expect(result).toEqual(mockList);
  });

  it("calls record_recent_vault", async () => {
    const mockList = [
      { path: "/vaults/b", name: "b", lastOpenedAt: 200, exists: true },
    ];
    vi.mocked(invoke).mockResolvedValueOnce(mockList);

    const result = await recordRecentVault("/vaults/b");
    expect(invoke).toHaveBeenCalledWith("record_recent_vault", {
      path: "/vaults/b",
    });
    expect(result).toEqual(mockList);
  });

  it("calls remove_recent_vault", async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);

    const result = await removeRecentVault("/vaults/a");
    expect(invoke).toHaveBeenCalledWith("remove_recent_vault", {
      path: "/vaults/a",
    });
    expect(result).toEqual([]);
  });

  it("calls check_vault_exists", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    const exists = await checkVaultExists("/vaults/a");
    expect(invoke).toHaveBeenCalledWith("check_vault_exists", {
      path: "/vaults/a",
    });
    expect(exists).toBe(true);
  });

  it("getAutoOpenVault returns first existing vault entry", async () => {
    const mockList = [
      {
        path: "/vaults/deleted",
        name: "deleted",
        lastOpenedAt: 300,
        exists: false,
      },
      { path: "/vaults/valid", name: "valid", lastOpenedAt: 200, exists: true },
      { path: "/vaults/older", name: "older", lastOpenedAt: 100, exists: true },
    ];
    vi.mocked(invoke).mockResolvedValueOnce(mockList);

    const auto = await getAutoOpenVault();
    expect(auto).toEqual({
      path: "/vaults/valid",
      name: "valid",
      lastOpenedAt: 200,
      exists: true,
    });
  });

  it("getAutoOpenVault returns null when no existing vault found", async () => {
    const mockList = [
      {
        path: "/vaults/deleted1",
        name: "deleted1",
        lastOpenedAt: 300,
        exists: false,
      },
      {
        path: "/vaults/deleted2",
        name: "deleted2",
        lastOpenedAt: 200,
        exists: false,
      },
    ];
    vi.mocked(invoke).mockResolvedValueOnce(mockList);

    const auto = await getAutoOpenVault();
    expect(auto).toBeNull();
  });
});
