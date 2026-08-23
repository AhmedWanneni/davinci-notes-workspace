import type { AttachmentSettings } from "./attachmentSettings";

function cleanFolder(folder: string): string {
  return folder.replaceAll("\\", "/").replace(/\/+$/g, "").replace(/^\.\//, "");
}

function noteFolder(notePath: string | null): string {
  const normalized = notePath?.replaceAll("\\", "/") ?? "";
  const separator = normalized.lastIndexOf("/");
  return separator < 0 ? "" : normalized.slice(0, separator);
}

/** Resolves a vault-relative or explicitly absolute target without I/O. */
export function resolveAttachmentFolder(
  notePath: string | null,
  settings: AttachmentSettings,
): string {
  const currentFolder = noteFolder(notePath);
  switch (settings.locationMode) {
    case "specified-folder":
      return cleanFolder(settings.specifiedFolder);
    case "note-folder":
      return currentFolder;
    case "note-subfolder": {
      const subfolder = cleanFolder(settings.noteSubfolder);
      return currentFolder ? `${currentFolder}/${subfolder}` : subfolder;
    }
    case "vault-root":
    default:
      return "";
  }
}
