import { Directory, File } from "expo-file-system";
import {
  isSyncthingConflictPath,
  isSyncthingTmpPath,
} from "@app/syncthing-api";
import {
  isHiddenPath,
  isMarkdownPath,
  normalizeToValidFileUri,
  normalizeVaultPath,
} from "./pathUtils";
import type { VaultScanResult } from "./types";

interface ScanContext {
  rootUri: string;
  notes: string[];
  folders: string[];
  attachments: string[];
  conflicts: string[];
  stats: Record<string, { size: number; mtime: number }>;
  visitedDirs: Set<string>;
}

async function scanDirectoryRecursive(
  currentDirUri: string,
  relativeDir: string,
  ctx: ScanContext,
): Promise<void> {
  if (ctx.visitedDirs.has(currentDirUri)) {
    return; // Prevent symlink recursion cycles
  }
  ctx.visitedDirs.add(currentDirUri);

  const dir = new Directory(currentDirUri);
  let entries: (Directory | File)[];
  try {
    entries = dir.list();
  } catch {
    return; // Directory inaccessible or unreadable
  }

  for (const entry of entries) {
    const entryName = entry.name;
    if (entryName.startsWith(".")) {
      continue; // Filter hidden files & folders (.git, .obsidian, .trash)
    }

    const relativePath = normalizeVaultPath(
      relativeDir ? `${relativeDir}/${entryName}` : entryName,
    );
    if (isHiddenPath(relativePath)) {
      continue;
    }

    if (entry instanceof Directory) {
      ctx.folders.push(relativePath);
      await scanDirectoryRecursive(entry.uri, relativePath, ctx);
    } else {
      if (isSyncthingTmpPath(relativePath)) {
        continue;
      }
      if (isSyncthingConflictPath(relativePath)) {
        ctx.conflicts.push(relativePath);
        continue;
      }

      const size = entry.size ?? 0;
      const mtime = entry.lastModified ?? entry.modificationTime ?? Date.now();

      ctx.stats[relativePath] = { size, mtime };

      if (isMarkdownPath(relativePath)) {
        ctx.notes.push(relativePath);
      } else {
        ctx.attachments.push(relativePath);
      }
    }
  }
}

export async function scanVaultDirectory(
  vaultRootUri: string,
): Promise<VaultScanResult> {
  const normalized = normalizeToValidFileUri(vaultRootUri);
  const rootUri = normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;

  const ctx: ScanContext = {
    rootUri,
    notes: [],
    folders: [],
    attachments: [],
    conflicts: [],
    stats: {},
    visitedDirs: new Set<string>(),
  };

  const rootDir = new Directory(rootUri);
  if (!rootDir.exists) {
    throw new Error(
      `Vault root directory does not exist or is not a directory: ${rootUri}`,
    );
  }

  await scanDirectoryRecursive(rootUri, "", ctx);

  // Natural sort for deterministic index ordering
  ctx.notes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  ctx.folders.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  ctx.attachments.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  ctx.conflicts.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  return {
    notes: ctx.notes,
    folders: ctx.folders,
    attachments: ctx.attachments,
    conflicts: ctx.conflicts,
    stats: ctx.stats,
  };
}
