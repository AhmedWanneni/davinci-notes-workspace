import React, { type JSX } from "react";

export interface InlineRenderOptions {
  onLinkClick?: (target: string) => void;
  onTagClick?: (tag: string) => void;
}

const INLINE_REGEX =
  /(\[\[(?:[^[\]|]+)(?:\|[^[\]]+)?\]\]|#[\w/-]+|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\)|<br\s*\/?>)/g;

export function renderInlineMarkdown(
  text: string,
  options: InlineRenderOptions = {},
): React.ReactNode {
  if (!text) return null;

  const parts = text.split(INLINE_REGEX);
  if (parts.length === 1) return text;

  return parts.map((part, index): JSX.Element | string => {
    if (!part) return "";

    if (part === "<br>" || part === "<br/>" || part === "<br />") {
      return <br key={index} />;
    }

    if (part.startsWith("[[") && part.endsWith("]]")) {
      const inner = part.slice(2, -2);
      const pipeIdx = inner.indexOf("|");
      const target = pipeIdx !== -1 ? inner.slice(0, pipeIdx) : inner;
      const label = pipeIdx !== -1 ? inner.slice(pipeIdx + 1) : inner;

      return (
        <button
          key={index}
          type="button"
          className="database-inline-wikilink"
          onClick={(e) => {
            e.stopPropagation();
            options.onLinkClick?.(target.trim());
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            color: "var(--color-interactive-accent, #cd47ab)",
            textDecoration: "underline",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          {label.trim()}
        </button>
      );
    }

    if (part.startsWith("#") && part.length > 1) {
      return (
        <span
          key={index}
          className="database-inline-tag"
          onClick={(e) => {
            e.stopPropagation();
            options.onTagClick?.(part.slice(1));
          }}
          style={{
            color: "var(--color-interactive-accent, #cd47ab)",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {part}
        </span>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return <s key={index}>{part.slice(2, -2)}</s>;
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          style={{
            padding: "1px 4px",
            background: "var(--color-bg-secondary, #f4f4f4)",
            borderRadius: "3px",
            fontSize: "0.85em",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const mdLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (mdLink) {
      const [, label, url] = mdLink;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: "var(--color-interactive-accent, #cd47ab)" }}
        >
          {label}
        </a>
      );
    }

    return part;
  });
}
