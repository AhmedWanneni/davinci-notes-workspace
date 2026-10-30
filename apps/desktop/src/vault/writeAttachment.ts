import {
  writeAttachment,
  type AttachmentData,
  type AttachmentFileSystem,
} from "@app/attachments";
import { createFolder, statNote, writeBinaryFile } from "./vaultCommands";

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

function toRelativeVaultPath(vaultPath: string, path: string): string {
  const vaultPrefix = `${vaultPath.replaceAll("\\", "/").replace(/\/+$/u, "")}/`;
  const normalized = path.replaceAll("\\", "/");
  return normalized.startsWith(vaultPrefix)
    ? normalized.slice(vaultPrefix.length)
    : normalized;
}

function createVaultFileSystem(vaultPath: string): AttachmentFileSystem {
  return {
    exists: async (path: string) => {
      const relPath = toRelativeVaultPath(vaultPath, path);
      if (!relPath) return true;
      try {
        const stat = await statNote(relPath);
        return Boolean(stat?.exists);
      } catch {
        return false;
      }
    },
    mkdir: async (path: string) => {
      const relPath = toRelativeVaultPath(vaultPath, path);
      if (!relPath) return;
      try {
        await createFolder(relPath);
      } catch {
        // Folder might already exist or be created by writeBinaryFile
      }
    },
    writeFile: async (path: string, data: Uint8Array) => {
      const relPath = toRelativeVaultPath(vaultPath, path);
      await writeBinaryFile(relPath, data);
    },
  };
}

/** Desktop native-fs entry point; targetFolder must come from Phase 1's resolver. */
export function writeAttachmentToVault(
  vaultPath: string,
  targetFolder: string,
  desiredFilename: string,
  data: AttachmentData,
): Promise<string> {
  const fileSystem = createVaultFileSystem(vaultPath);
  return writeAttachment(
    fileSystem,
    vaultPath,
    targetFolder,
    desiredFilename,
    data,
  );
}
