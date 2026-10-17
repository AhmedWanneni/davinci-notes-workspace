import type { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import { defaultVaultIndexer } from "../indexer";
import {
  extractH1Title,
  sanitizeFilenameStem,
  noteStemsEqual,
  buildNotePathInFolder,
} from "./h1Extractor";
import { updateWikilinksForRename } from "./wikilinkUpdater";
import { atomicWriteNote } from "./atomicNoteWriter";

export interface H1SyncResult {
  renamed: boolean;
  newPath: string;
  linksUpdatedCount: number;
}

/**
 * Port of ADR-0060 Bidirectional H1 <-> filename sync with feedback-loop guard.
 *
 * Rules:
 * 1. Extract first H1 after frontmatter.
 * 2. Sanitize stem (remove \ / : * ? " < > |, trim trailing dots).
 * 3. FEEDBACK-LOOP GUARD: Compare sanitized stem to current stem case-insensitively;
 *    skip if they already match.
 * 4. COLLISION GUARD: If target filename already exists, DO NOT rename (log warning).
 * 5. Update wikilinks across vault notes referencing oldStem to newStem.
 * 6. Atomically update notes and incrementally re-index via withDbLock.
 */
export async function syncH1ToFilename(
  adapter: MobileVaultStorageAdapter,
  currentPath: string,
  content: string,
): Promise<H1SyncResult> {
  const h1 = extractH1Title(content);
  if (!h1) {
    return { renamed: false, newPath: currentPath, linksUpdatedCount: 0 };
  }

  const newStem = sanitizeFilenameStem(h1);
  if (!newStem) {
    return { renamed: false, newPath: currentPath, linksUpdatedCount: 0 };
  }

  const currentFilename = currentPath.split("/").pop() ?? currentPath;
  const currentStem = currentFilename.replace(/\.md$/i, "");

  // FEEDBACK-LOOP GUARD: Do not rename if stem already matches case-insensitively
  if (noteStemsEqual(newStem, currentStem)) {
    return { renamed: false, newPath: currentPath, linksUpdatedCount: 0 };
  }

  const targetPath = buildNotePathInFolder(currentPath, newStem);
  if (targetPath === currentPath) {
    return { renamed: false, newPath: currentPath, linksUpdatedCount: 0 };
  }

  // COLLISION GUARD: Never overwrite an existing note file
  const destStat = await adapter.statFile(targetPath);
  if (destStat.exists) {
    console.warn(
      `[vault] H1 rename skipped — destination exists: ${targetPath}`,
    );
    return { renamed: false, newPath: currentPath, linksUpdatedCount: 0 };
  }

  // 1. Rename on disk
  await adapter.renameNote(currentPath, targetPath);

  // 2. Propagate wikilinks in other vault notes
  let linksUpdatedCount = 0;
  const scan = await adapter.scanVault();
  for (const otherNotePath of scan.notes) {
    if (otherNotePath === currentPath || otherNotePath === targetPath) continue;

    try {
      const file = await adapter.readNote(otherNotePath);
      const updated = updateWikilinksForRename(
        file.content,
        currentStem,
        newStem,
      );
      if (updated !== file.content) {
        await atomicWriteNote(adapter, otherNotePath, updated);
        linksUpdatedCount++;
      }
    } catch {
      // Ignore read error for missing/transient note
    }
  }

  // 3. Incremental index update through withDbLock
  await defaultVaultIndexer.indexVault(adapter, false);

  return {
    renamed: true,
    newPath: targetPath,
    linksUpdatedCount,
  };
}
