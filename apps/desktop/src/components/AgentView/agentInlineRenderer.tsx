import { type ReactNode } from "react";

export function renderInlineTokens(
  text: string,
  onNavigateNote?: (path: string) => void,
): ReactNode[] {
  if (!text) return [];

  // Match: `inline code`, **bold**, *italic*, ~~strike~~, [[wikilink]], [text](url)
  const pattern =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={idx} className="agent-md-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return <del key={idx}>{part.slice(2, -2)}</del>;
    }
    if (part.startsWith("[[") && part.endsWith("]]") && part.length >= 4) {
      const rawTarget = part.slice(2, -2);
      const [target, label] = rawTarget.split("|");
      return (
        <button
          key={idx}
          type="button"
          className="agent-md-wikilink"
          onClick={() => onNavigateNote?.(target.trim())}
          title={`Open note: ${target.trim()}`}
        >
          {label?.trim() || target.trim()}
        </button>
      );
    }
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="agent-md-link"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    return part;
  });
}
