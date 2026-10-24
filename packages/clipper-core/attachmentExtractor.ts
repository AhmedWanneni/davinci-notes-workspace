import type { ClipAttachmentRef } from "./ClipPayload.js";

const MARKDOWN_IMAGE_REGEX =
  /!\[([^\]]*)\]\((<[^>\n]+>|[^)\s]+)(?:\s+"([^"]*)")?\)/gu;
const HTML_IMAGE_REGEX =
  /<img\b[^>]*?\bsrc=["'](https?:\/\/[^"'\s>]+)["'][^>]*>/giu;

const VALID_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
]);

/**
 * Extracts unique http/https image attachments from a markdown body.
 */
export function extractImageAttachments(markdown: string): ClipAttachmentRef[] {
  if (!markdown || !markdown.includes("http")) return [];

  const seenUrls = new Set<string>();
  const attachments: ClipAttachmentRef[] = [];

  const recordUrl = (rawUrl: string, alt?: string) => {
    let cleanUrl = rawUrl.trim();
    if (cleanUrl.startsWith("<") && cleanUrl.endsWith(">")) {
      cleanUrl = cleanUrl.slice(1, -1).trim();
    }
    if (
      (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) ||
      seenUrls.has(cleanUrl)
    ) {
      return;
    }
    seenUrls.add(cleanUrl);
    attachments.push({
      sourceUrl: cleanUrl,
      suggestedName: deriveSuggestedImageName(cleanUrl, attachments.length),
      alt: alt?.trim() ? alt.trim() : undefined,
    });
  };

  for (const match of markdown.matchAll(MARKDOWN_IMAGE_REGEX)) {
    const alt = match[1];
    const url = match[2];
    if (url) recordUrl(url, alt);
  }

  for (const match of markdown.matchAll(HTML_IMAGE_REGEX)) {
    const url = match[1];
    if (url) recordUrl(url);
  }

  return attachments;
}

/**
 * Derives a clean filename from a URL path, defaulting to a safe name with valid extension.
 */
export function deriveSuggestedImageName(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const rawFilename = pathname.split("/").filter(Boolean).pop() ?? "";
    const decoded = decodeURIComponent(rawFilename);
    const sanitized = decoded.replaceAll(/[\\/:*?"<>|\0]/gu, "_").trim();

    const dotIndex = sanitized.lastIndexOf(".");
    if (dotIndex > 0) {
      const stem = sanitized.slice(0, dotIndex).replace(/^\.+/u, "");
      const ext = sanitized.slice(dotIndex + 1).toLowerCase();
      if (VALID_IMAGE_EXTENSIONS.has(ext)) {
        return `${stem || `image-${index + 1}`}.${ext}`;
      }
    }
    if (sanitized && !sanitized.startsWith(".")) {
      return `${sanitized}.png`;
    }
  } catch {
    // If URL parsing fails, fall back to default
  }
  return `image-${index + 1}.png`;
}

/**
 * Rewrites markdown and HTML image references from remote source URLs to local vault paths.
 */
export function rewriteMarkdownImageLinks(
  markdown: string,
  replacements: Map<string, string>,
): string {
  if (replacements.size === 0 || !markdown) return markdown;

  let result = markdown.replace(
    MARKDOWN_IMAGE_REGEX,
    (fullMatch, alt, rawUrl, title) => {
      let cleanUrl = rawUrl.trim();
      if (cleanUrl.startsWith("<") && cleanUrl.endsWith(">")) {
        cleanUrl = cleanUrl.slice(1, -1).trim();
      }
      const localPath = replacements.get(cleanUrl);
      if (!localPath) return fullMatch;
      const titleSuffix = title ? ` "${title}"` : "";
      return `![${alt}](${localPath}${titleSuffix})`;
    },
  );

  result = result.replace(HTML_IMAGE_REGEX, (fullMatch, rawUrl) => {
    const localPath = replacements.get(rawUrl.trim());
    if (!localPath) return fullMatch;
    return fullMatch.replace(rawUrl, localPath);
  });

  return result;
}
