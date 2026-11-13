import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseIconMap,
  serializeIconMap,
  loadTreeIcons,
  persistTreeIcon,
  ICONS_JSON_PATH,
} from "../vault/treeIconStorage";
import { defaultVaultManager, type VaultInfo } from "../vault/vaultManager";
import type { MobileVaultStorageAdapter } from "../vault/vaultStorageAdapter";

vi.mock("../vault/vaultManager", () => ({
  defaultVaultManager: {
    getActiveAdapter: vi.fn(),
  },
}));

describe("Mobile Tree Icon Storage (.davinci/icons.json)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses valid emoji icons from json map", () => {
    const json = JSON.stringify({
      Work: "💼",
      Personal: "🏠",
      InvalidText: "hello",
    });
    const parsed = parseIconMap(json);
    expect(parsed["Work"]).toBe("💼");
    expect(parsed["Personal"]).toBe("🏠");
    expect(parsed["InvalidText"]).toBeUndefined();
  });

  it("serializes icons map to clean json", () => {
    const icons = { Work: "💼", Personal: "🏠" };
    const serialized = serializeIconMap(icons);
    expect(serialized).toContain('"Work": "💼"');
    expect(serialized).toContain('"Personal": "🏠"');
  });

  it("loads tree icons from active adapter .davinci/icons.json", async () => {
    const mockAdapter = {
      statFile: vi.fn().mockResolvedValue({ exists: true }),
      readNote: vi.fn().mockResolvedValue({
        content: JSON.stringify({ Projects: "🚀" }),
      }),
    };
    vi.mocked(defaultVaultManager.getActiveAdapter).mockResolvedValue({
      adapter: mockAdapter as unknown as MobileVaultStorageAdapter,
      info: {} as unknown as VaultInfo,
      hasAnyVaults: true,
    });

    const icons = await loadTreeIcons();
    expect(icons["Projects"]).toBe("🚀");
  });

  it("persists tree icon into .davinci/icons.json", async () => {
    const mockAdapter = {
      statFile: vi.fn().mockResolvedValue({ exists: true }),
      createFolder: vi.fn(),
      writeNote: vi.fn().mockResolvedValue({ mtime: Date.now() }),
    };
    vi.mocked(defaultVaultManager.getActiveAdapter).mockResolvedValue({
      adapter: mockAdapter as unknown as MobileVaultStorageAdapter,
      info: {} as unknown as VaultInfo,
      hasAnyVaults: true,
    });

    const updated = await persistTreeIcon("Study", "📚", {});
    expect(updated["Study"]).toBe("📚");
    expect(mockAdapter.writeNote).toHaveBeenCalledWith(
      ICONS_JSON_PATH,
      expect.stringContaining('"Study": "📚"'),
    );

    const removed = await persistTreeIcon("Study", null, updated);
    expect(removed["Study"]).toBeUndefined();
  });
});
