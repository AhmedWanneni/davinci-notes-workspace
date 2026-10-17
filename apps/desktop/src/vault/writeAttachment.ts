import { exists, mkdir, writeFile } from "@tauri-apps/plugin-fs";
import { writeAttachment, type AttachmentData } from "@app/attachments";

const tauriFileSystem = {
  exists,
  mkdir: (path: string) => mkdir(path, { recursive: true }),
  writeFile,
};

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

/** Desktop native-fs entry point; targetFolder must come from Phase 1's resolver. */
export function writeAttachmentToVault(
  vaultPath: string,
  targetFolder: string,
  desiredFilename: string,
  data: AttachmentData,
): Promise<string> {
  return writeAttachment(
    tauriFileSystem,
    vaultPath,
    targetFolder,
    desiredFilename,
    data,
  );
}
