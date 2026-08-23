/** Provisional until the source document's authoritative list is available. */
export const ACCEPTED_ATTACHMENT_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "svg",
  "mp3", "wav", "m4a", "mp4", "webm", "mov", "pdf",
]);

export function isAcceptedAttachmentName(fileName: string): boolean {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  return ACCEPTED_ATTACHMENT_EXTENSIONS.has(extension);
}
