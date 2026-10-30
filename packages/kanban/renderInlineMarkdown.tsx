import React from "react";

export interface InlineRenderOptions {
  onLinkClick?: (target: string) => void;
  onTagClick?: (tag: string) => void;
}

const INLINE_TOKEN_REGEX =
  /(\[\[(?<wikiTarget>[^|\]]+)(?:\|(?<wikiAlias>[^\]]+))?\]\]|\[(?<mdText>[^\]]+)\]\((?<mdUrl>[^)]+)\)|(?<=^|\s)(?<tag>#[a-zA-Z0-9_\-/]+)|\*\*(?<bold>[^*]+)\*\*|(?<!\*)\*(?<italic>[^*]+)\*(?!\*)|~~(?<strike>[^~]+)~~|`(?<code>[^`]+)`|(?<dateToken>@\{[^}]+\}))/g;

export function renderInlineMarkdown(
  text: string,
  options?: InlineRenderOptions,
): React.ReactNode {
  if (!text) return null;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_TOKEN_REGEX.lastIndex = 0;

  while ((match = INLINE_TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const groups = match.groups || {};
    const key = `token-${match.index}`;

    if (groups.wikiTarget) {
      const target = groups.wikiTarget.trim();
      const label = groups.wikiAlias ? groups.wikiAlias.trim() : target;
      elements.push(
        <button
          key={key}
          type="button"
          className="kanban-inline-wikilink"
          onClick={(e) => {
            e.stopPropagation();
            options?.onLinkClick?.(target);
          }}
        >
          {label}
        </button>,
      );
    } else if (groups.mdText && groups.mdUrl) {
      elements.push(
        <a
          key={key}
          href={groups.mdUrl}
          className="kanban-inline-link"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {groups.mdText}
        </a>,
      );
    } else if (groups.tag) {
      const tagName = groups.tag.replace(/^#/, "");
      elements.push(
        <span
          key={key}
          className="kanban-inline-tag"
          onClick={(e) => {
            e.stopPropagation();
            options?.onTagClick?.(tagName);
          }}
        >
          {groups.tag}
        </span>,
      );
    } else if (groups.bold) {
      elements.push(<strong key={key}>{groups.bold}</strong>);
    } else if (groups.italic) {
      elements.push(<em key={key}>{groups.italic}</em>);
    } else if (groups.strike) {
      elements.push(<del key={key}>{groups.strike}</del>);
    } else if (groups.code) {
      elements.push(<code key={key}>{groups.code}</code>);
    } else if (groups.dateToken) {
      elements.push(
        <span key={key} className="kanban-inline-token">
          {groups.dateToken}
        </span>,
      );
    }

    lastIndex = INLINE_TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return <>{elements}</>;
}
