import { type ReactNode } from "react";
import { AgentCodeBlock } from "./AgentCodeBlock";
import { AgentMermaidBlock } from "./AgentMermaidBlock";
import { AgentTableBlock } from "./AgentTableBlock";

export interface AgentMarkdownContentProps {
  content: string;
  onNavigateNote?: (notePath: string) => void;
  onSaveAsNote?: (snippet: string) => void;
}

function renderInlineFormatting(
  text: string,
  onNavigateNote?: (path: string) => void,
): ReactNode[] {
  // Matches ![alt](url), `code`, **bold**, *italic*, and [[wikilink]]
  const tokenRegex =
    /(!\[[^\]]*\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\])/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith("![") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/!\[([^\]]*)\]\(([^)]+)\)/);
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
  onSaveAsNote,
}: AgentMarkdownContentProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = "";
  let listBuffer: ReactNode[] = [];
  let tableBuffer: string[] = [];

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

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      elements.push(
        <AgentTableBlock
          key={`table-${elements.length}`}
          markdownTable={tableBuffer.join("\n")}
        />,
      );
      tableBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushList();
      flushTable();
      if (inCodeBlock) {
        const fullCode = codeBuffer.join("\n");
        if (codeLang.toLowerCase() === "mermaid") {
          elements.push(
            <AgentMermaidBlock
              key={`mermaid-${i}`}
              source={fullCode}
              onSaveAsNote={onSaveAsNote}
            />,
          );
        } else {
          elements.push(
            <AgentCodeBlock
              key={`code-${i}`}
              code={fullCode}
              lang={codeLang}
              onSaveAsNote={onSaveAsNote}
            />,
          );
        }
        codeBuffer = [];
        inCodeBlock = false;
        codeLang = "";
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      tableBuffer.push(trimmed);
      continue;
    } else {
      flushTable();
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

    if (!trimmed) {
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
  flushTable();

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <AgentCodeBlock
        key="code-unterminated"
        code={codeBuffer.join("\n")}
        lang={codeLang}
        onSaveAsNote={onSaveAsNote}
      />,
    );
  }

  return <div className="agent-markdown-content">{elements}</div>;
}
