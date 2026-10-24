import { describe, expect, it } from "vitest";
import type { StorageArea } from "../storage/storageArea";
import { MAX_HIGHLIGHTS_PER_URL } from "./HighlightRecord";
import {
  boundedHighlights,
  HIGHLIGHTS_KEY,
  loadHighlights,
  saveHighlight,
} from "./highlightStore";

function memoryStorage(
  initial: Record<string, unknown> = {},
): StorageArea & { data: Record<string, unknown> } {
  const data = { ...initial };
  return {
    data,
    async get(key) {
      return key === null
        ? { ...data }
        : { [key as string]: data[key as string] };
    },
    async set(items) {
      Object.assign(data, items);
    },
  };
}

describe("highlightStore", () => {
  it("normalises a URL and ignores malformed stored records", async () => {
    const area = memoryStorage({
      [HIGHLIGHTS_KEY]: [
        {
          id: "a",
          url: "https://example.test/a#section",
          text: " quote ",
          occurrence: 0,
          createdAt: "2026-01-01",
        },
        { nope: true },
      ],
    });
    await expect(
      loadHighlights(area, "https://example.test/a#other"),
    ).resolves.toEqual([
      {
        id: "a",
        url: "https://example.test/a",
        text: "quote",
        occurrence: 0,
        createdAt: "2026-01-01",
      },
    ]);
  });

  it("bounds each URL oldest-first", () => {
    const records = Array.from(
      { length: MAX_HIGHLIGHTS_PER_URL + 2 },
      (_, index) => ({
        id: `${index}`,
        url: "https://example.test/",
        text: "x",
        occurrence: 0,
        createdAt: `2026-01-${String(index + 1).padStart(3, "0")}`,
      }),
    );
    expect(boundedHighlights(records)).toHaveLength(MAX_HIGHLIGHTS_PER_URL);
  });

  it("persists a new highlight", async () => {
    const area = memoryStorage();
    await saveHighlight(area, {
      id: "a",
      url: "https://example.test/",
      text: "quote",
      occurrence: 0,
      createdAt: "2026-01-01",
    });
    await expect(
      loadHighlights(area, "https://example.test/"),
    ).resolves.toHaveLength(1);
  });
});
