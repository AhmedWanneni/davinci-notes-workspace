import { describe, it, expect, vi } from "vitest";
import { syncExternalDirectoryToSandbox } from "./syncExternalDirectory";
import * as FileSystem from "expo-file-system/legacy";

vi.mock("expo-file-system/legacy", () => ({
  readDirectoryAsync: vi.fn(),
  getInfoAsync: vi.fn(),
  makeDirectoryAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
  writeAsStringAsync: vi.fn(),
}));

describe("syncExternalDirectoryToSandbox", () => {
  it("copies markdown files into target sandbox folder and skips hidden files", async () => {
    vi.mocked(FileSystem.readDirectoryAsync).mockResolvedValueOnce([
      ".hidden",
      ".davinci",
      "Note1.md",
      "Subfolder",
    ]);

    vi.mocked(FileSystem.getInfoAsync).mockImplementation(
      async (uri: string) => {
        if (uri.endsWith("/Subfolder")) {
          return {
            exists: true,
            isDirectory: true,
            size: 0,
            modificationTime: 0,
            uri,
          };
        }
        return {
          exists: true,
          isDirectory: false,
          size: 20,
          modificationTime: 0,
          uri,
        };
      },
    );

    vi.mocked(FileSystem.readDirectoryAsync).mockResolvedValueOnce([
      "Nested.md",
    ]);
    vi.mocked(FileSystem.readAsStringAsync).mockResolvedValue("# Content");

    const count = await syncExternalDirectoryToSandbox(
      "content://tree/primary:Notes",
      "file:///app/vaults/Notes",
    );

    expect(count).toBe(2);
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      "file:///app/vaults/Notes/Note1.md",
      "# Content",
    );
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      "file:///app/vaults/Notes/Subfolder",
      { intermediates: true },
    );
  });
});
