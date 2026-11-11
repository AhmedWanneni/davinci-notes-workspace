export const MARKDOWN_LINK_REGEX =
  /(?<!!)\[([^\]]*)\]\((<[^>\n]+>|[^)\s]+)\)/g;
export const AUTOLINK_REGEX = /<(https?:\/\/[^>\n]+)>/g;

export function sanitizeLinkDestination(rawDest: string): string {
  const trimmed = rawDest.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function isExternalUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("ftp://")
  );
}

export function resolveInternalMarkdownFallback(
  destination: string,
  sourcePath: string,
  notePaths: readonly string[],
): { target: string; resolved: boolean } {
  const normalizedDest = destination.split("#")[0]?.trim() ?? destination;
  if (!normalizedDest) {
    return { target: destination, resolved: false };
  }

  const stem =
    normalizedDest.replace(/\.md$/i, "").split("/").pop()?.toLowerCase() ?? "";
  const match = notePaths.find((path) => {
    const pathStem =
      path.replace(/\.md$/i, "").split("/").pop()?.toLowerCase() ?? "";
    return (
      pathStem === stem || path.toLowerCase() === normalizedDest.toLowerCase()
    );
  });

  if (match) {
    return { target: match, resolved: true };
  }

  return { target: destination, resolved: false };
}
