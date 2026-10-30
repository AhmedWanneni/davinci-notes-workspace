import { type ReactNode } from "react";

export interface AgentMarkdownContentProps {
  content: string;
  onNavigateNote?: (notePath: string) => void;
}

function renderInlineFormatting(
  text: string,
  onNavigateNote?: (path: string) => void,
): ReactNode[] {
  // Matches `code`, **bold**, *italic*, and [[wikilink]]
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\])/g;
  const parts = text.split(tokenRegex);

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
    return part;
  });
}

export function AgentMarkdownContent({
  content,
  onNavigateNote,
}: AgentMarkdownContentProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = "";
  let listBuffer: ReactNode[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="agent-md-list">
          {listBuffer}
        </ul>,
      );
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="agent-md-codeblock">
            {codeLang && (
              <div className="agent-md-codeblock__lang">{codeLang}</div>
            )}
            <pre className="agent-md-codeblock__pre">
              <code>{codeBuffer.join("\n")}</code>
            </pre>
          </div>,
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeLang = "";
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(
        <li key={`li-${i}`} className="agent-md-list-item">
          {renderInlineFormatting(line.slice(2), onNavigateNote)}
        </li>,
      );
      continue;
    }

    flushList();

    if (!line.trim()) {
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${i}`} className="agent-md-heading agent-md-heading--h3">
          {renderInlineFormatting(line.slice(4), onNavigateNote)}
        </h4>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${i}`} className="agent-md-heading agent-md-heading--h2">
          {renderInlineFormatting(line.slice(3), onNavigateNote)}
        </h3>,
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${i}`} className="agent-md-heading agent-md-heading--h1">
          {renderInlineFormatting(line.slice(2), onNavigateNote)}
        </h2>,
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="agent-md-paragraph">
          {renderInlineFormatting(line, onNavigateNote)}
        </p>,
      );
    }
  }

  flushList();

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <div key="code-unterminated" className="agent-md-codeblock">
        <pre className="agent-md-codeblock__pre">
          <code>{codeBuffer.join("\n")}</code>
        </pre>
      </div>,
    );
  }

  return <div className="agent-markdown-content">{elements}</div>;
}
