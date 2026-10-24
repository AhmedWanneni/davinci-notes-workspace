import type { AttachmentSettings } from "@app/attachments";
import { resolveAttachmentFolder } from "@app/attachments";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";
import { writeAttachmentToVault } from "../../vault";

export interface InsertLocalImageOptions {
  vaultPath: string;
  activeNotePath: string | null;
  attachmentSettings: AttachmentSettings;
}

export function computeVaultRelativeLink(
  vaultPath: string,
  writtenPath: string,
): string {
  const vaultPrefix = `${vaultPath.replaceAll("\\", "/").replace(/\/+$/u, "")}/`;
  const normalizedWritten = writtenPath.replaceAll("\\", "/");
  const linkTarget = normalizedWritten.startsWith(vaultPrefix)
    ? normalizedWritten.slice(vaultPrefix.length)
    : normalizedWritten;
  return linkTarget;
}

/**
 * Copies a local image file into the vault attachments folder using the
 * existing attachment pipeline (naming, collision handling, accepted formats).
 * Returns the vault-relative path for embedding.
 */
export async function copyImageFileToVault(
  options: InsertLocalImageOptions,
  filename: string,
  data: Uint8Array | Blob,
): Promise<string> {
  const { vaultPath, activeNotePath, attachmentSettings } = options;
  const folder = resolveAttachmentFolder(
    activeNotePath || "Untitled.md",
    attachmentSettings,
  );

  const writtenPath = await writeAttachmentToVault(
    vaultPath,
    folder,
    filename,
    data,
  );

  return computeVaultRelativeLink(vaultPath, writtenPath);
}

/**
 * Prompts the user to select an image via the platform dialog adapter,
 * reads the bytes, and copies the image to the vault attachments folder.
 */
export async function insertLocalImage(
  options: InsertLocalImageOptions,
): Promise<string | null> {
  if (!hasPlatformAdapters()) return null;

  const picked = await getPlatformAdapters().dialog.pickImageFile();
  if (!picked) return null;

  return copyImageFileToVault(options, picked.name, picked.data);
}
