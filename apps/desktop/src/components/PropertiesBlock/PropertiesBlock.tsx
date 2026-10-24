import React, { useState } from "react";
import {
  CaretDown,
  CaretRight,
  Tag,
  CalendarBlank,
  User,
  Link as LinkIcon,
  List,
  Plus,
} from "@phosphor-icons/react";
import type { Frontmatter } from "@app/core-types";
import { Badge, Typography } from "@app/design-system";

export interface PropertiesBlockProps {
  frontmatter: Frontmatter;
  onLinkClick?: (target: string) => void;
}

function getPropertyIcon(key: string, value: unknown): React.ReactNode {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("tag")) return <Tag size={14} />;
  if (
    lowerKey.includes("date") ||
    lowerKey.includes("created") ||
    lowerKey.includes("modified") ||
    lowerKey.includes("updated")
  ) {
    return <CalendarBlank size={14} />;
  }
  if (
    lowerKey.includes("author") ||
    lowerKey.includes("user") ||
    lowerKey.includes("creator")
  ) {
    return <User size={14} />;
  }
  if (typeof value === "string" && value.includes("[[")) {
    return <LinkIcon size={14} />;
  }
  return <List size={14} />;
}

function renderPropertyValue(
  value: unknown,
  key: string,
  onLinkClick?: (target: string) => void,
): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="properties-block__empty-value">empty</span>;
  }

  // Tags special handling
  if (key.toLowerCase().includes("tag")) {
    const tags = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/[\s,]+/).filter(Boolean)
        : [String(value)];
    return (
      <div className="properties-block__tags">
        {tags.map((tag, idx) => {
          const cleanTag = String(tag).replace(/^#/, "");
          return (
            <Badge key={idx} variant="accent">
              {`#${cleanTag}`}
            </Badge>
          );
        })}
      </div>
    );
  }

  // Arrays
  if (Array.isArray(value)) {
    return (
      <div className="properties-block__array">
        {value.map((item, idx) => (
          <span key={idx} className="properties-block__array-item">
            {renderPropertyValue(item, "", onLinkClick)}
            {idx < value.length - 1 && (
              <span className="properties-block__separator">, </span>
            )}
          </span>
        ))}
      </div>
    );
  }

  // Wikilink string e.g. [[Note Name]]
  if (typeof value === "string") {
    const wikiMatch = value.match(/^\[\[(.*?)\]\]$/);
    if (wikiMatch) {
      const target = wikiMatch[1];
      return (
        <a
          href="#"
          className="properties-block__link"
          onClick={(e) => {
            e.preventDefault();
            onLinkClick?.(target);
          }}
        >
          {target}
        </a>
      );
    }
    return <span className="properties-block__text">{value}</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className="properties-block__bool">{value ? "true" : "false"}</span>
    );
  }

  return <span className="properties-block__text">{String(value)}</span>;
}

const HIDDEN_FRONTMATTER_KEYS = new Set([
  "cover",
  "banner",
  "cover_y",
  "banner_y",
  "coverY",
  "bannerY",
  "icon",
]);

export function PropertiesBlock({
  frontmatter,
  onLinkClick,
}: PropertiesBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const entries = Object.entries(frontmatter).filter(
    ([key]) => !HIDDEN_FRONTMATTER_KEYS.has(key),
  );
  const propertyCount = entries.length;

  if (propertyCount === 0) {
    return null;
  }

  return (
    <div className="properties-block" data-expanded={isExpanded || undefined}>
      <button
        type="button"
        className="properties-block__header"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span className="properties-block__chevron" aria-hidden="true">
          {isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </span>
        <Typography
          variant="text"
          size="xs"
          weight="semibold"
          className="properties-block__title"
        >
          Properties
        </Typography>
        <span className="properties-block__count">{propertyCount}</span>
      </button>

      {isExpanded && (
        <div className="properties-block__content">
          <div className="properties-block__rows">
            {entries.map(([key, value]) => (
              <div key={key} className="properties-block__row">
                <div className="properties-block__key">
                  <span
                    className="properties-block__key-icon"
                    aria-hidden="true"
                  >
                    {getPropertyIcon(key, value)}
                  </span>
                  <span className="properties-block__key-label">{key}</span>
                </div>
                <div className="properties-block__value">
                  {renderPropertyValue(value, key, onLinkClick)}
                </div>
              </div>
            ))}
          </div>

          <div className="properties-block__footer">
            <button
              type="button"
              className="properties-block__add-btn"
              title="Inline property editing available in future release"
            >
              <Plus size={12} />
              <span>Add property</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
