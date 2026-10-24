import { describe, expect, it, vi } from "vitest";
import {
  FileSystemAccessAdapter,
  type DirectoryHandleLike,
  type FileHandleLike,
} from "./FileSystemAccessAdapter";
import { OpfsFileSystemAdapter } from "./OpfsFileSystemAdapter";
import { WebExternalUrlAdapter } from "./WebExternalUrlAdapter";
import { WebSecretStoreAdapter } from "./WebSecretStoreAdapter";
import { WebVaultRegistryAdapter } from "./WebVaultRegistryAdapter";
import { WebWatcherAdapter } from "./WebWatcherAdapter";

describe("Phase 2: Browser File System & Storage Adapters", () => {
  it("creates 5-level nested folders, writes a 500 KB markdown file, and reads it back byte-for-byte", async () => {
    const fs = new OpfsFileSystemAdapter();
    await fs.createFolder("a/b/c/d/e");
    expect(await fs.exists("a/b/c/d/e")).toBe(true);

    const largeText = "# Large Note\n" + "DaVinci Web Vault Line.\n".repeat(22000);
    expect(largeText.length).toBeGreaterThan(500_000);

    await fs.writeTextFile("a/b/c/d/e/large.md", largeText);
    const readBack = await fs.readTextFile("a/b/c/d/e/large.md");
    expect(readBack).toBe(largeText);

    const stat = await fs.stat("a/b/c/d/e/large.md");
    expect(stat.size).toBe(new TextEncoder().encode(largeText).byteLength);
  });

  it("rejects unsafe directory traversal and forbidden characters", async () => {
    const fs = new OpfsFileSystemAdapter();
    await expect(fs.writeTextFile("../secret.md", "bad")).rejects.toThrow(
      /Unsafe vault path traversal/,
    );
    await expect(fs.writeTextFile("notes/bad\0file.md", "bad")).rejects.toThrow(
      /null byte is forbidden/,
    );
    await expect(fs.writeTextFile("notes/bad:name.md", "bad")).rejects.toThrow(
      /Invalid character/,
    );
  });

  it("renames a folder containing 50 notes and updates all nested paths", async () => {
    const fs = new OpfsFileSystemAdapter();
    await fs.createFolder("projects/alpha");

    for (let i = 1; i <= 50; i++) {
      await fs.writeTextFile(`projects/alpha/note-${i}.md`, `# Note ${i}`);
    }

    await fs.renameFolder("projects/alpha", "projects/beta");

    expect(await fs.exists("projects/alpha")).toBe(false);
    expect(await fs.exists("projects/beta")).toBe(true);

    for (let i = 1; i <= 50; i++) {
      expect(await fs.exists(`projects/alpha/note-${i}.md`)).toBe(false);
      expect(await fs.readTextFile(`projects/beta/note-${i}.md`)).toBe(
        `# Note ${i}`,
      );
    }
  });

  it("debounces 10 rapid watcher writes into a single batch callback", async () => {
    vi.useFakeTimers();
    try {
      const watcher = new WebWatcherAdapter(400);
      const onChange = vi.fn();
      await watcher.start(onChange);

      for (let i = 1; i <= 10; i++) {
        watcher.notifyChanged([`note-${i}.md`]);
        vi.advanceTimersByTime(10);
      }

      expect(onChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(400);
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0][0].paths).toHaveLength(10);
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles FileSystemAccessAdapter permission prompt and file I/O", async () => {
    const storedBytes = new Map<string, Uint8Array>();

    const mockFileHandle: FileHandleLike = {
      name: "hello.md",
      getFile: async () =>
        new File(
          [(storedBytes.get("hello.md") ?? new Uint8Array()).buffer as ArrayBuffer],
          "hello.md",
        ),
      createWritable: async () => ({
        write: async (data) => {
          storedBytes.set(
            "hello.md",
            typeof data === "string" ? new TextEncoder().encode(data) : data,
          );
        },
        close: async () => {},
      }),
    };

    const mockRoot: DirectoryHandleLike = {
      name: "vault",
      getDirectoryHandle: async () => mockRoot,
      getFileHandle: async () => mockFileHandle,
      removeEntry: async (name) => {
        storedBytes.delete(name);
      },
      queryPermission: async () => "prompt",
      requestPermission: async () => "granted",
    };

    const fsa = new FileSystemAccessAdapter(mockRoot);
    expect(await fsa.ensureWritePermission()).toBe(true);

    await fsa.writeTextFile("hello.md", "# From FSA");
    expect(await fsa.readTextFile("hello.md")).toBe("# From FSA");
  });

  it("enforces protocol safety in WebExternalUrlAdapter and stores secrets/vaults", async () => {
    const urlAdapter = new WebExternalUrlAdapter();
    await expect(urlAdapter.openUrl("javascript:alert(1)")).rejects.toThrow(
      /Blocked unsafe URL protocol/,
    );

    const secrets = new WebSecretStoreAdapter();
    await secrets.setSecret("ai:openai", "sk-test");
    expect(await secrets.getSecret("ai:openai")).toBe("sk-test");
    await secrets.clearSecret("ai:openai");
    expect(await secrets.getSecret("ai:openai")).toBeNull();

    const registry = new WebVaultRegistryAdapter();
    await registry.recordRecentVault("opfs://v1", "Vault 1");
    const list = await registry.getRecentVaults();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Vault 1");
  });
});
