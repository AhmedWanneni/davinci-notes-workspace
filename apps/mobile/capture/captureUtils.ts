import type { MobileVaultStorageAdapter } from "../vault";

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

export function formatFileTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return `${y}-${m}-${d} ${h}-${min}-${s}`;
}

export function formatDateStamp(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

/**
 * Disambiguates an attachment filename in a target folder using ADR-0110 rules:
 * photo.jpg -> photo 1.jpg -> photo 2.jpg
 */
export async function resolveAttachmentCollision(
  adapter: MobileVaultStorageAdapter,
  folder: string,
  desiredFilename: string,
): Promise<string> {
  const dotIndex = desiredFilename.lastIndexOf(".");
  const stem =
    dotIndex >= 0 ? desiredFilename.slice(0, dotIndex) : desiredFilename;
  const ext = dotIndex >= 0 ? desiredFilename.slice(dotIndex) : "";

  const cleanFolder = folder.replace(/\/+$/, "");
  let candidatePath = cleanFolder
    ? `${cleanFolder}/${desiredFilename}`
    : desiredFilename;
  let counter = 1;

  let stat = await adapter.statFile(candidatePath);
  while (stat.exists) {
    const candidateName = `${stem} ${counter}${ext}`;
    candidatePath = cleanFolder
      ? `${cleanFolder}/${candidateName}`
      : candidateName;
    counter++;
    stat = await adapter.statFile(candidatePath);
  }

  return candidatePath;
}

/**
 * Disambiguates a note path using ADR-0180 numeric suffix rules:
 * Note.md -> Note 1.md -> Note 2.md
 */
export async function resolveNoteCollision(
  adapter: MobileVaultStorageAdapter,
  desiredPath: string,
): Promise<string> {
  const stem = desiredPath.replace(/\.md$/i, "");
  let candidatePath = desiredPath;
  let counter = 1;

  let stat = await adapter.statFile(candidatePath);
  while (stat.exists) {
    candidatePath = `${stem} ${counter}.md`;
    counter++;
    stat = await adapter.statFile(candidatePath);
  }

  return candidatePath;
}
