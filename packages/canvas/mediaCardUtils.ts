export type FileCardType =
  | "markdown"
  | "image"
  | "video"
  | "pdf"
  | "canvas"
  | "unknown";

export const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "bmp",
  "ico",
  "avif",
]);

export const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "ogg",
  "ogv",
  "mov",
  "mkv",
  "m4v",
]);

export const PDF_EXTENSIONS = new Set(["pdf"]);
export const CANVAS_EXTENSIONS = new Set(["canvas"]);

export function getFileExtension(filePath: string): string {
  if (!filePath) return "";
  const parts = filePath.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

export function getFileCardType(filePath: string): FileCardType {
  if (!filePath) return "unknown";
  const ext = getFileExtension(filePath);
  if (ext === "md") return "markdown";
  if (ext === "canvas" || CANVAS_EXTENSIONS.has(ext)) return "canvas";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (PDF_EXTENSIONS.has(ext)) return "pdf";
  return "unknown";
}

export function isMediaFile(filePath: string): boolean {
  const type = getFileCardType(filePath);
  return type === "image" || type === "video";
}

export function isPdfFile(filePath: string): boolean {
  return getFileCardType(filePath) === "pdf";
}

export function isCanvasFile(filePath: string): boolean {
  return getFileCardType(filePath) === "canvas";
}


export function generatePastedMediaFilename(extension = "png"): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  return `attachments/Pasted image ${timestamp}.${extension}`;
}
