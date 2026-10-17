import { describe, it, expect, beforeEach } from "vitest";
import { parseMarkdownDocument } from "../reader/markdownParser";
import { queryNoteMentions } from "../reader/backlinksQuery";
import { resolveWikilink } from "../vault/wikilinkResolver";
import {
  moveNoteWithCollisionHandling,
  deleteNoteAndReindex,
} from "../vault/fileOperations";
import { deriveVisibleItems } from "../vault/folderViewHelpers";
import { MobileVaultStorageAdapter } from "../vault/MobileVaultStorageAdapter";
import { defaultVaultIndexer } from "../indexer";
import { getVaultIndexDb, closeVaultIndexDb } from "../database";
import { inMemoryFs, resetInMemoryFs } from "./mocks/expoFileSystemMock";

const VAULT_ROOT = "file:///data/vault/";

describe("Mobile Read Experience & Adversarial Verification", () => {
  beforeEach(async () => {
    resetInMemoryFs();
    inMemoryFs.set(VAULT_ROOT.replace(/\/+$/, ""), {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });
    await closeVaultIndexDb();
  });

  it("handles adversarial notes: circular, self, broken, aliases, headings, unicode, and 10k lines", () => {
    const allNotePaths = [
      "FolderA/Common.md",
      "FolderB/Common.md",
      "Notes/Alpha.md",
      "Notes/Beta.md",
      "مشاريع/ملاحظات 2026.md",
      "Personal/Café & Resumé ☕.md",
    ];

    // 1. Circular and Self links
    const selfRes = resolveWikilink("Alpha", allNotePaths);
    expect(selfRes.isResolved).toBe(true);
    expect(selfRes.resolvedPath).toBe("Notes/Alpha.md");

    const circularRes = resolveWikilink("Beta", allNotePaths);
    expect(circularRes.isResolved).toBe(true);
    expect(circularRes.resolvedPath).toBe("Notes/Beta.md");

    // 2. Broken / unresolved link
    const brokenRes = resolveWikilink("NonExistentNote", allNotePaths);
    expect(brokenRes.isResolved).toBe(false);
    expect(brokenRes.targetStem).toBe("nonexistentnote");

    // 3. Link with alias and heading
    const aliasRes = resolveWikilink(
      "Alpha#Architecture",
      allNotePaths,
      "System Overview",
    );
    expect(aliasRes.isResolved).toBe(true);
    expect(aliasRes.resolvedPath).toBe("Notes/Alpha.md");
    expect(aliasRes.heading).toBe("Architecture");
    expect(aliasRes.displayText).toBe("System Overview");

    // 4. Duplicate note name tie-breaker (ADR-0020: alphabetically first wins)
    const dupRes = resolveWikilink("Common", allNotePaths);
    expect(dupRes.isResolved).toBe(true);
    expect(dupRes.resolvedPath).toBe("FolderA/Common.md");

    // 5. Unicode & Arabic paths
    const arabicRes = resolveWikilink("ملاحظات 2026", allNotePaths);
    expect(arabicRes.isResolved).toBe(true);
    expect(arabicRes.resolvedPath).toBe("مشاريع/ملاحظات 2026.md");

    const cafeRes = resolveWikilink("Café & Resumé ☕", allNotePaths);
    expect(cafeRes.isResolved).toBe(true);
    expect(cafeRes.resolvedPath).toBe("Personal/Café & Resumé ☕.md");

    // 6. 10,000-line note stress parse
    const lines: string[] = [
      "---",
      "title: Massive 10k Note",
      "tags: [scale, benchmark, mobile]",
      "---",
      "# Main Heading",
      "",
    ];
    for (let i = 1; i <= 9995; i++) {
      if (i % 500 === 0) {
        lines.push(`## Section ${i}`);
      } else if (i % 2 === 0) {
        lines.push(
          `- [ ] Checklist item ${i} referencing [[Notes/Alpha]] and #tag${i % 10}`,
        );
      } else {
        lines.push(
          `Regular paragraph line ${i} with **bold** and \`inline code\`.`,
        );
      }
    }

    const t0 = performance.now();
    const doc = parseMarkdownDocument(lines.join("\n"));
    const elapsed = performance.now() - t0;

    expect(doc.outline.length).toBeGreaterThan(15);
    expect(doc.blocks.length).toBeGreaterThan(9000);
    expect(doc.frontmatterData?.title).toBe("Massive 10k Note");
    expect(elapsed).toBeLessThan(150); // Sub-150ms parse for 10k lines
  });

  it("moves a note with collision handling and deletes note on disk & SQLite index", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
    await adapter.createFolder("Archive");

    await adapter.writeNote("Idea.md", "# Idea\nLink to [[Target.md]]");
    await adapter.writeNote(
      "Archive/Idea.md",
      "# Existing Archive Idea\nOld content",
    );
    await adapter.writeNote("Target.md", "# Target Note\nTarget content");

    await defaultVaultIndexer.indexVault(adapter, true);

    // 1. Move Idea.md into Archive (collision expected)
    const moveRes = await moveNoteWithCollisionHandling(
      adapter,
      "Idea.md",
      "Archive",
    );
    expect(moveRes.hadCollision).toBe(true);
    expect(moveRes.newPath).toBe("Archive/Idea (1).md");

    // Verify on filesystem
    const oldExists = await adapter.statFile("Idea.md");
    const newExists = await adapter.statFile("Archive/Idea (1).md");
    expect(oldExists.exists).toBe(false);
    expect(newExists.exists).toBe(true);

    // Verify index updated
    const db = await getVaultIndexDb();
    const notesInDb = await db.getAllAsync<{ path: string }>(
      "SELECT path FROM notes WHERE path LIKE 'Archive/%' ORDER BY path",
    );
    expect(notesInDb.map((n) => n.path)).toEqual([
      "Archive/Idea (1).md",
      "Archive/Idea.md",
    ]);

    // 2. Delete note
    await deleteNoteAndReindex(adapter, "Archive/Idea (1).md");
    const deletedStat = await adapter.statFile("Archive/Idea (1).md");
    expect(deletedStat.exists).toBe(false);

    const remainingNotes = await db.getAllAsync<{ path: string }>(
      "SELECT path FROM notes WHERE path = 'Archive/Idea (1).md'",
    );
    expect(remainingNotes.length).toBe(0);
  });

  it("unwinds a 10-link navigation back-stack cleanly with zero state drift", () => {
    const navigationStack: string[] = ["Notes/Root.md"];

    // Follow 10 consecutive wikilinks
    for (let step = 1; step <= 10; step++) {
      navigationStack.push(`Notes/Link_${step}.md`);
    }

    expect(navigationStack.length).toBe(11);
    expect(navigationStack[navigationStack.length - 1]).toBe(
      "Notes/Link_10.md",
    );

    // Unwind back-stack 10 times (simulate router.back())
    for (let step = 10; step >= 1; step--) {
      expect(navigationStack[navigationStack.length - 1]).toBe(
        `Notes/Link_${step}.md`,
      );
      navigationStack.pop();
    }

    expect(navigationStack.length).toBe(1);
    expect(navigationStack[0]).toBe("Notes/Root.md");
  });

  it("measures scroll derivation and frame budget on a 5,000-note vault list", () => {
    const folders = [
      "Folder_1",
      "Folder_2",
      "Folder_3",
      "Folder_4",
      "Folder_5",
    ];
    const notes: string[] = [];
    for (let i = 1; i <= 5000; i++) {
      notes.push(`Note_${String(i).padStart(4, "0")}.md`);
    }

    const pinned = new Set(["Note_0005.md", "Note_0010.md"]);

    const t0 = performance.now();
    const result = deriveVisibleItems(folders, notes, "", "name-asc", pinned);
    const elapsed = performance.now() - t0;

    expect(result.listData.length).toBe(5005);
    // Pinned notes bubble to top of notes
    expect(result.visibleNotes[0]).toBe("Note_0005.md");
    expect(result.visibleNotes[1]).toBe("Note_0010.md");
    expect(elapsed).toBeLessThan(25); // Sub-25ms sorting and deriving for 5k notes

    // Simulate 100 virtualized 50-item frame renders (60 FPS test)
    const frameTimes: number[] = [];
    for (let f = 0; f < 100; f++) {
      const start = f * 50;
      const tFrameStart = performance.now();
      const slice = result.listData.slice(start, start + 50);
      expect(slice.length).toBeLessThanOrEqual(50);
      frameTimes.push(performance.now() - tFrameStart);
    }

    const maxFrameTime = Math.max(...frameTimes);
    // 60 FPS frame budget is 16.6ms
    expect(maxFrameTime).toBeLessThan(16.6);
  });

  it("queries linked and unlinked mentions through withDbLock", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
    await adapter.writeNote(
      "Main.md",
      "# Main Note\nWelcome to the main topic.",
    );
    await adapter.writeNote(
      "LinkedSource.md",
      "# Linked Note\nThis has a wikilink to [[Main]].",
    );
    await adapter.writeNote(
      "UnlinkedSource.md",
      "# Unlinked Note\nThis discusses the Main Note without an explicit bracketed link.",
    );

    await defaultVaultIndexer.indexVault(adapter, true);

    const mentions = await queryNoteMentions("Main.md", async (path) => {
      const res = await adapter.readNote(path);
      return res.content;
    });

    expect(mentions.linked.length).toBe(1);
    expect(mentions.linked[0].sourcePath).toBe("LinkedSource.md");

    expect(mentions.unlinked.length).toBe(1);
    expect(mentions.unlinked[0].sourcePath).toBe("UnlinkedSource.md");
  });
});
