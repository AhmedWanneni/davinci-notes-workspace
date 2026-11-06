import React from "react";
import {
  Tag,
  CalendarBlank,
  User,
  Link as LinkIcon,
  List,
} from "@phosphor-icons/react";
import { Badge } from "@app/design-system";

export function getPropertyIcon(key: string, value: unknown): React.ReactNode {
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

export function renderPropertyValue(
  value: unknown,
  key: string,
  onLinkClick?: (target: string) => void,
): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="properties-block__empty-value">Empty</span>;
  }

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
            e.stopPropagation();
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
