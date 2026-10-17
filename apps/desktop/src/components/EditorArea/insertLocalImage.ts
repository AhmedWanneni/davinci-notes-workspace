import type { AttachmentSettings } from "@app/attachments";
import { resolveAttachmentFolder } from "@app/attachments";
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
 * Lazy-loads the Tauri file dialog, prompts the user to select an image,
 * reads the bytes, and copies the image to the vault attachments folder.
 */
export async function insertLocalImage(
  options: InsertLocalImageOptions,
): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple: false,
    directory: false,
    title: "Select image",
    filters: [
      {
        name: "Image",
        extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
      },
    ],
  });

  if (!selected || Array.isArray(selected)) return null;

  const filePath = selected as string;
  const filename =
    filePath.replaceAll("\\", "/").split("/").pop() ?? "image.png";

  const { readFile } = await import("@tauri-apps/plugin-fs");
  const bytes = await readFile(filePath);

  return copyImageFileToVault(options, filename, bytes);
}
