import type { MobileVaultStorageAdapter } from "../vault";
import { atomicWriteNote } from "../vault";
import { defaultVaultIndexer } from "../indexer";
import { formatDateStamp } from "./captureUtils";

export function getDailyNotePath(date: Date = new Date()): string {
  const dateStr = formatDateStamp(date);
  return `daily/${dateStr}.md`;
}

/**
 * Ensures today's daily note exists in the vault.
 * Creates it atomically with a `# YYYY-MM-DD` title if missing, and indexes it under withDbLock.
 */
export async function ensureDailyNote(
  adapter: MobileVaultStorageAdapter,
  date: Date = new Date(),
): Promise<{ path: string; created: boolean; content: string }> {
  const path = getDailyNotePath(date);
  const dateStr = formatDateStamp(date);

  const stat = await adapter.statFile(path);
  if (stat.exists) {
    const file = await adapter.readNote(path);
    return { path, created: false, content: file.content };
  }

  const initialContent = `# ${dateStr}\n\n`;
  await atomicWriteNote(adapter, path, initialContent);
  await defaultVaultIndexer.indexVault(adapter, false);

  return { path, created: true, content: initialContent };
}
