import { getVaultIndexDb, withDbLock } from "../database";

export interface MentionItem {
  sourcePath: string;
  sourceTitle: string;
  snippet: string;
  matchText?: string;
  isLinked: boolean;
}

export interface BacklinksResult {
  linked: MentionItem[];
  unlinked: MentionItem[];
}

/**
 * Queries linked and unlinked mentions for a note, serialized under withDbLock.
 */
export async function queryNoteMentions(
  targetPath: string,
  readNoteContent: (path: string) => Promise<string | null>,
): Promise<BacklinksResult> {
  const db = await getVaultIndexDb();
  const stem = targetPath.replace(/\.md$/i, "").split("/").pop() ?? targetPath;

  return withDbLock(async () => {
    // 1. Linked mentions via links table
    const linkRows = await db.getAllAsync<{ source_path: string }>(
      `SELECT DISTINCT source_path FROM links
       WHERE target_path = ? AND resolved = 1
       ORDER BY source_path;`,
      targetPath,
    );

    const linkedPaths = linkRows.map((r) => r.source_path);
    const linkedSet = new Set(linkedPaths);

    // Build linked items with snippet from note content
    const linked: MentionItem[] = [];
    for (const srcPath of linkedPaths) {
      const title = srcPath.replace(/\.md$/i, "").split("/").pop() ?? srcPath;
      let snippet = `Linked to ${stem}`;
      try {
        const content = await readNoteContent(srcPath);
        if (content) {
          const lines = content.split("\n");
          const lineWithLink = lines.find((l) =>
            l.toLowerCase().includes(stem.toLowerCase()),
          );
          if (lineWithLink) {
            snippet = lineWithLink.trim();
          }
        }
      } catch {
        // Fallback snippet
      }

      linked.push({
        sourcePath: srcPath,
        sourceTitle: title,
        snippet,
        matchText: stem,
        isLinked: true,
      });
    }

    // 2. Unlinked mentions via FTS5
    const unlinked: MentionItem[] = [];
    // Sanitize stem for FTS5 term match (strip punctuation)
    const sanitizedStem = stem.replace(/['"/*-]/g, " ").trim();
    if (sanitizedStem.length >= 2) {
      try {
        const ftsQuery = `"${sanitizedStem.replace(/"/g, '""')}"`;
        const ftsRows = await db.getAllAsync<{ path: string; snippet: string }>(
          `SELECT path, snippet(notes_fts, 1, '<mark>', '</mark>', '...', 20) as snippet
           FROM notes_fts
           WHERE notes_fts MATCH ? AND path != ?
           LIMIT 40;`,
          ftsQuery,
          targetPath,
        );

        for (const row of ftsRows) {
          if (!linkedSet.has(row.path)) {
            const title =
              row.path.replace(/\.md$/i, "").split("/").pop() ?? row.path;
            unlinked.push({
              sourcePath: row.path,
              sourceTitle: title,
              snippet: row.snippet.replace(/<\/?mark>/g, ""),
              matchText: stem,
              isLinked: false,
            });
          }
        }
      } catch (err) {
        // FTS syntax errors on peculiar symbols gracefully ignored
        console.warn("FTS unlinked mention error:", err);
      }
    }

    return { linked, unlinked };
  });
}
