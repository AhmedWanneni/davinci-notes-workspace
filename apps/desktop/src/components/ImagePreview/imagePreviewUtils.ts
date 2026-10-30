const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i;

export function isImagePath(path: string | null | undefined): boolean {
  if (!path) return false;
  return IMAGE_EXTENSION_REGEX.test(path);
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
