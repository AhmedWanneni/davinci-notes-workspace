export type AttachmentLocationMode =
  | "vault-root"
  | "specified-folder"
  | "note-folder"
  | "note-subfolder";

export interface AttachmentSettings {
  locationMode: AttachmentLocationMode;
  specifiedFolder: string;
  noteSubfolder: string;
}

export const DEFAULT_ATTACHMENT_SETTINGS: AttachmentSettings = {
  locationMode: "vault-root",
  specifiedFolder: "",
  noteSubfolder: "attachments",
};

export function parseAttachmentSettings(raw: string | null): AttachmentSettings {
  if (!raw) return DEFAULT_ATTACHMENT_SETTINGS;
  try {
    const value = JSON.parse(raw) as Partial<AttachmentSettings>;
    if (!["vault-root", "specified-folder", "note-folder", "note-subfolder"].includes(value.locationMode ?? "")) {
      return DEFAULT_ATTACHMENT_SETTINGS;
    }
    return {
      locationMode: value.locationMode as AttachmentLocationMode,
      specifiedFolder: typeof value.specifiedFolder === "string" ? value.specifiedFolder : "",
      noteSubfolder: typeof value.noteSubfolder === "string" ? value.noteSubfolder : "attachments",
    };
  } catch { return DEFAULT_ATTACHMENT_SETTINGS; }
}
