import { describe, expect, it, vi } from "vitest";
import {
  extractSearchTerms,
  findSuggestedVaultLinks,
  detectActionItems,
  synthesizeMeetingSummary,
} from "./meetingListenerEngine.js";
import type { VaultInspectionBackend } from "./vaultInspectionTools.js";

describe("meetingListenerEngine", () => {
  it("extracts frequent non-stopword keywords", () => {
    const text =
      "Architecture review of database sync engine and sqlite database performance optimization.";
    const terms = extractSearchTerms(text, 3);
    expect(terms).toContain("database");
    expect(terms.length).toBeLessThanOrEqual(3);
  });

  it("finds suggested vault links via backend FTS", async () => {
    const mockBackend: VaultInspectionBackend = {
      listPaths: vi.fn(),
      readNote: vi.fn(),
      searchFts: vi
        .fn()
        .mockResolvedValue([
          {
            path: "Architecture/Database.md",
            snippet: "SQLite WAL mode",
            score: 0.95,
          },
        ]),
    };

    const links = await findSuggestedVaultLinks(
      "We need database tuning",
      mockBackend,
    );
    expect(links).toHaveLength(1);
    expect(links[0].title).toBe("Database");
    expect(links[0].path).toBe("Architecture/Database.md");
    expect(links[0].reason).toContain("database");
  });

  it("detects action items via regex heuristic when no LLM provided", async () => {
    const text =
      "We need to fix the memory leak before release. Also I will update the documentation.";
    const items = await detectActionItems(text);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(
      items.some((i) => i.toLowerCase().includes("fix the memory leak")),
    ).toBe(true);
  });

  it("synthesizes meeting summary with LLM caller if available", async () => {
    const llmCaller = vi
      .fn()
      .mockResolvedValue("Team aligned on database performance.");
    const summary = await synthesizeMeetingSummary(
      "Discussed db speed.",
      undefined,
      llmCaller,
    );
    expect(summary).toBe("Team aligned on database performance.");
    expect(llmCaller).toHaveBeenCalled();
  });
});
