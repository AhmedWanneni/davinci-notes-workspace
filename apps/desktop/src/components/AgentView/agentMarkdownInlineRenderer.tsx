import { type ReactNode } from "react";

export interface InlineRenderContext {
  onNavigateNote?: (path: string) => void;
  onNavigateFolder?: (folderPath: string) => void;
  allFolderPaths?: string[];
  allNotePaths?: string[];
}

export function renderInlineFormatting(
  text: string,
  ctx: InlineRenderContext = {},
): ReactNode[] {
  const {
    onNavigateNote,
    onNavigateFolder,
    allFolderPaths = [],
    allNotePaths = [],
  } = ctx;

  // Matches ![alt](url), [label](url), `code`, **bold**, *italic*, and [[wikilink]]
  const tokenRegex =
    /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\])/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    // 1. Image: ![alt](url)
    if (part.startsWith("![") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <span key={idx} className="agent-md-image-card">
            <img
              src={match[2]}
              alt={match[1] || "Generated content"}
              loading="lazy"
            />
            {match[1] && (
              <span className="agent-md-image-caption">{match[1]}</span>
            )}
          </span>
        );
      }
    }

    // 2. Markdown Link: [label](target)
    if (
      part.startsWith("[") &&
      !part.startsWith("[[") &&
      part.includes("](") &&
      part.endsWith(")")
    ) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const label = match[1];
        const target = match[2].trim();
        const isExternal = /^https?:\/\//i.test(target);
        if (isExternal) {
          return (
            <a
              key={idx}
              href={target}
              target="_blank"
              rel="noreferrer noopener"
              className="agent-md-link"
            >
              {label}
            </a>
          );
        }

        const cleanTarget = target.replace(/^\/+|\/+$/g, "");
        const isFolder =
          allFolderPaths.includes(cleanTarget) || target.endsWith("/");
        return (
          <button
            key={idx}
            type="button"
            className="agent-md-wikilink"
            onClick={() =>
              isFolder
                ? onNavigateFolder?.(cleanTarget)
                : onNavigateNote?.(cleanTarget)
            }
            title={
              isFolder
                ? `Open folder: ${cleanTarget}`
                : `Open note: ${cleanTarget}`
            }
          >
            {label}
          </button>
        );
      }
    }

    // 3. Inline code or backticked note/folder
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1).trim();
      const cleanInner = inner.replace(/^\/+|\/+$/g, "");
      const isKnownFolder =
        Boolean(cleanInner) &&
        (allFolderPaths.includes(cleanInner) ||
          (inner.endsWith("/") && !cleanInner.includes(" ")));
      const isKnownNote =
        Boolean(cleanInner) &&
        (allNotePaths.includes(cleanInner) ||
          allNotePaths.includes(`${cleanInner}.md`) ||
          cleanInner.endsWith(".md"));

      if (isKnownFolder || isKnownNote) {
        return (
          <button
            key={idx}
            type="button"
            className="agent-md-wikilink"
            onClick={() =>
              isKnownFolder
                ? onNavigateFolder?.(cleanInner)
                : onNavigateNote?.(cleanInner)
            }
            title={
              isKnownFolder
                ? `Open folder: ${cleanInner}`
                : `Open note: ${cleanInner}`
            }
          >
            {inner}
          </button>
        );
      }
      return (
        <code key={idx} className="agent-md-code">
          {inner}
        </code>
      );
    }

    // 4. Bold: **bold**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }

    // 5. Italic: *italic*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }

    // 6. Wikilink: [[target]] or [[target|label]]
    if (part.startsWith("[[") && part.endsWith("]]") && part.length >= 4) {
      const rawTarget = part.slice(2, -2);
      const [target, label] = rawTarget.split("|");
      const trimmedTarget = target.trim();
      const cleanFolder = trimmedTarget.replace(/^\/+|\/+$/g, "");
      const isFolder =
        allFolderPaths.includes(cleanFolder) || trimmedTarget.endsWith("/");
      return (
        <button
          key={idx}
          type="button"
          className="agent-md-wikilink"
          onClick={() =>
            isFolder
              ? onNavigateFolder?.(cleanFolder)
              : onNavigateNote?.(trimmedTarget)
          }
          title={
            isFolder
              ? `Open folder: ${cleanFolder}`
              : `Open note: ${trimmedTarget}`
          }
        >
          {label?.trim() || trimmedTarget}
        </button>
      );
    }

    return part;
  });
}
