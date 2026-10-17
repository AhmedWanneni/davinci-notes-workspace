import { describe, it, expect, beforeEach } from "vitest";
import {
  getVaultIndexDb,
  verifyFts5Support,
  withDbLock,
  withDbTransaction,
  persistNotesBatch,
  closeVaultIndexDb,
} from "../database";
import { searchVault } from "../indexer/mobileSearch";
import { noteFromMarkdown } from "../indexer/noteFromMarkdown";
import { buildTagIndex } from "@app/indexer";

describe("Mobile SQLite FTS5 & Search Verification", () => {
  beforeEach(async () => {
    await closeVaultIndexDb();
  });

  it("verifies expo-sqlite FTS5 support with compile options, virtual table, snippet, and bm25", async () => {
    const db = await getVaultIndexDb();
    const verification = await verifyFts5Support(db);

    expect(verification.hasCompileOption).toBe(true);
    expect(verification.canCreateFts5).toBe(true);
    expect(verification.canMatchFts5).toBe(true);
    expect(verification.sampleResult).toBeDefined();

    const sample = verification.sampleResult as {
      snippet: string;
      score: number;
    };
    expect(sample.snippet).toContain("<mark>DaVinci</mark>");
    expect(typeof sample.score).toBe("number");
  });

  it("performs full-text search with highlighted snippets and tag filters using shared indexer", async () => {
    const db = await getVaultIndexDb();

    // Seed notes
    const note1 = noteFromMarkdown(
      "projects/mobile.md",
      `---\ntags: [mobile, react-native]\n---\n# Mobile Architecture\nBuilding local-first notes with CodeMirror 6 and SQLite FTS5 search.`,
      Date.now(),
      ["projects/mobile.md", "recipes/coffee.md"],
    );

    const note2 = noteFromMarkdown(
      "recipes/coffee.md",
      `---\ntags: [recipe]\n---\n# Espresso Recipe\nHow to dial in coffee with 18g dose and 36g yield in 30 seconds.`,
      Date.now(),
      ["projects/mobile.md", "recipes/coffee.md"],
    );

    await withDbLock(() =>
      withDbTransaction(db, () => persistNotesBatch(db, [note1, note2])),
    );

    const tagIndex = buildTagIndex([note1, note2]);

    // 1. Plain term search
    const results = await searchVault("CodeMirror", tagIndex);
    expect(results.length).toBe(1);
    expect(results[0].path).toBe("projects/mobile.md");
    expect(results[0].snippet).toContain("<mark>CodeMirror</mark>");

    // 2. Tag operator search
    const tagResults = await searchVault("tag:recipe", tagIndex);
    expect(tagResults.length).toBe(1);
    expect(tagResults[0].path).toBe("recipes/coffee.md");

    // 3. Combined term + tag filter
    const combinedResults = await searchVault(
      "CodeMirror tag:mobile",
      tagIndex,
    );
    expect(combinedResults.length).toBe(1);
    expect(combinedResults[0].path).toBe("projects/mobile.md");

    // 4. Tag exclusion operator
    const excludedResults = await searchVault(
      "CodeMirror -tag:mobile",
      tagIndex,
    );
    expect(excludedResults.length).toBe(0);
  });
});
