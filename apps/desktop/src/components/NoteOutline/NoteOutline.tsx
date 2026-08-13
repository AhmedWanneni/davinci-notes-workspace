import React, { useMemo } from "react";
import { TextH } from "@phosphor-icons/react";
import { Typography } from "@app/design-system";

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
  line: number;
}

export interface NoteOutlineProps {
  content: string;
  onHeadingClick?: (heading: HeadingItem) => void;
}

/** Extract headings (H1-H6) from markdown text. */
export function extractHeadings(markdown: string): HeadingItem[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const headings: HeadingItem[] = [];

  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```") || line.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].trim();
      // Strip markdown formatting like **bold**, *italic*, [[wikilinks]]
      const cleanText = rawText
        .replace(/\[\[(.*?)\]\]/g, "$1")
        .replace(/[*_`~]/g, "");

      headings.push({
        id: `heading-${i}-${cleanText.toLowerCase().replace(/\s+/g, "-")}`,
        level,
        text: cleanText,
        line: i + 1,
      });
    }
  }

  return headings;
}

export function NoteOutline({ content, onHeadingClick }: NoteOutlineProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  if (headings.length === 0) {
    return (
      <div className="note-outline note-outline--empty">
        <Typography variant="text" size="xs" color="muted">
          No headings in this note
        </Typography>
      </div>
    );
  }

  return (
    <div
      className="note-outline"
      role="navigation"
      aria-label="Table of contents"
    >
      <ul className="note-outline__list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className="note-outline__item"
            data-level={heading.level}
            style={{
              paddingLeft: `calc(var(--space-2) + ${heading.level - 1} * var(--space-3))`,
            }}
            onClick={() => onHeadingClick?.(heading)}
          >
            <span className="note-outline__icon" aria-hidden="true">
              <TextH size={12} weight="bold" />
            </span>
            <span className="note-outline__text" title={heading.text}>
              {heading.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
