import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadNoteCovers,
  persistNoteCover,
  COVERS_JSON_PATH,
} from "./noteCoverStorage";

const readNote = vi.fn();
const writeNote = vi.fn();

vi.mock("../../vault", () => ({
  readNote: (...args: unknown[]) => readNote(...args),
  writeNote: (...args: unknown[]) => writeNote(...args),
  withVaultWatchSuppressed: async <T>(fn: () => Promise<T>) => fn(),
}));

describe("noteCoverStorage", () => {
  beforeEach(() => {
    readNote.mockReset();
    writeNote.mockReset().mockResolvedValue(undefined);
  });

  it("loads covers from .davinci/covers.json", async () => {
    readNote.mockResolvedValue({
      content: JSON.stringify({
        "books.md": { url: "https://example.com/cover.jpg", y: 40 },
      }),
    });

    const covers = await loadNoteCovers();
    expect(covers["books.md"]).toEqual({
      url: "https://example.com/cover.jpg",
      y: 40,
    });
  });

  it("returns empty object if .davinci/covers.json does not exist", async () => {
    readNote.mockRejectedValue(new Error("File not found"));
    const covers = await loadNoteCovers();
    expect(covers).toEqual({});
  });

  it("persists updated cover into .davinci/covers.json", async () => {
    const current = { "old.md": { url: "old.jpg", y: 50 } };
    const next = await persistNoteCover(
      "new.md",
      { url: "new.jpg", y: 30 },
      current,
    );

    expect(next["new.md"]).toEqual({ url: "new.jpg", y: 30 });
    expect(writeNote).toHaveBeenCalledWith(
      COVERS_JSON_PATH,
      expect.stringContaining('"new.md"'),
    );
  });

  it("deletes cover when setting to null", async () => {
    const current = { "delete.md": { url: "delete.jpg", y: 50 } };
    const next = await persistNoteCover("delete.md", null, current);

    expect(next["delete.md"]).toBeUndefined();
    expect(writeNote).toHaveBeenCalledWith(
      COVERS_JSON_PATH,
      expect.not.stringContaining('"delete.md"'),
    );
  });
});
