import { describe, it, expect, vi } from "vitest";
import type { AIProvider } from "@app/ai-api";
import {
  classifyBookmarkDeterministically,
  organizeBookmarksWithAI,
  parseAIOrganizationResponse,
} from "./organizeBookmarksWithAI";
import type { WebBookmarkItem } from "./bookmarkTypes";

const SAMPLE_ITEMS: WebBookmarkItem[] = [
  {
    id: "b1",
    url: "https://github.com/tauri-apps/tauri",
    title: "Tauri Repo",
    domain: "github.com",
    addedAt: 1000,
  },
  {
    id: "b2",
    url: "https://arxiv.org/abs/2303.08774",
    title: "GPT-4 Technical Report",
    domain: "arxiv.org",
    addedAt: 2000,
  },
  {
    id: "b3",
    url: "https://figma.com/community",
    title: "Figma UI Kits",
    domain: "figma.com",
    addedAt: 3000,
  },
];

describe("organizeBookmarksWithAI", () => {
  it("classifies bookmarks deterministically when offline or unconfigured", () => {
    const dev = classifyBookmarkDeterministically(SAMPLE_ITEMS[0]);
    expect(dev.folder).toBe("Development");
    expect(dev.tags).toContain("dev");

    const ai = classifyBookmarkDeterministically(SAMPLE_ITEMS[1]);
    expect(ai.folder).toBe("AI & Research");
    expect(ai.tags).toContain("ai");

    const design = classifyBookmarkDeterministically(SAMPLE_ITEMS[2]);
    expect(design.folder).toBe("Design & UI");
    expect(design.tags).toContain("design");
  });

  it("parses fenced and raw JSON responses from AI provider", () => {
    const validIds = new Set(["b1", "b2"]);
    const raw = `\`\`\`json
[
  { "id": "b1", "folder": "Rust & Tauri", "tags": ["#Rust", "Desktop"] },
  { "id": "unknown", "folder": "Ignored", "tags": [] }
]
\`\`\``;
    const parsed = parseAIOrganizationResponse(raw, validIds);
    expect(parsed).toEqual([
      { id: "b1", folder: "Rust & Tauri", tags: ["rust", "desktop"] },
    ]);
  });

  it("uses AI provider when available and falls back for missing items", async () => {
    const mockProvider: AIProvider = {
      id: "gemini",
      mode: "cloud",
      capabilities: new Set(["chat"]),
      embed: vi.fn(),
      complete: vi.fn().mockResolvedValue({
        content: JSON.stringify([
          { id: "b1", folder: "Open Source", tags: ["tauri", "rust"] },
        ]),
        model: "gemini-2.0-flash",
      }),
      dispose: vi.fn().mockResolvedValue(undefined),
    };

    const result = await organizeBookmarksWithAI(SAMPLE_ITEMS, {
      providerFactory: async () => mockProvider,
    });

    expect(result.usedAI).toBe(true);
    expect(result.organizedCount).toBe(3);
    expect(result.updates.find((u) => u.id === "b1")).toEqual({
      id: "b1",
      folder: "Open Source",
      tags: ["tauri", "rust"],
    });
    // b2 fell back to deterministic classification
    expect(result.updates.find((u) => u.id === "b2")?.folder).toBe(
      "AI & Research",
    );
    expect(mockProvider.dispose).toHaveBeenCalled();
  });

  it("falls back cleanly when AI provider throws", async () => {
    const result = await organizeBookmarksWithAI(SAMPLE_ITEMS, {
      providerFactory: async () => null,
    });
    expect(result.usedAI).toBe(false);
    expect(result.updates).toHaveLength(3);
  });
});
