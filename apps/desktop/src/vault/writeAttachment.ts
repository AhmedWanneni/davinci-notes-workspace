import {
  writeAttachment,
  type AttachmentData,
  type AttachmentFileSystem,
} from "@app/attachments";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

const platformFileSystem: AttachmentFileSystem = {
  exists: (path: string) => {
    if (hasPlatformAdapters()) {
      return getPlatformAdapters().fs.exists(path);
    }
    return Promise.resolve(false);
  },
  mkdir: (path: string) => {
    if (hasPlatformAdapters()) {
      return getPlatformAdapters().fs.mkdir(path);
    }
    return Promise.resolve();
  },
  writeFile: (path: string, data: Uint8Array) => {
    if (hasPlatformAdapters()) {
      return getPlatformAdapters().fs.writeFile(path, data);
    }
    return Promise.resolve();
  },
};

/** Platform-agnostic attachment writer entry point; targetFolder must come from Phase 1's resolver. */
export function writeAttachmentToVault(
  vaultPath: string,
  targetFolder: string,
  desiredFilename: string,
  data: AttachmentData,
): Promise<string> {
  return writeAttachment(
    platformFileSystem,
    vaultPath,
    targetFolder,
    desiredFilename,
    data,
  );
}
