import { type ReactNode } from "react";
import { AgentCodeBlock } from "./AgentCodeBlock";
import { AgentMermaidBlock } from "./AgentMermaidBlock";
import { AgentTableBlock } from "./AgentTableBlock";
import { AgentWidgetBlock } from "./AgentWidgetBlock";
import { AgentWidgetPlaceholder } from "./AgentWidgetPlaceholder";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export interface AgentMarkdownContentProps {
  content: string;
  isStreaming?: boolean;
  onNavigateNote?: (notePath: string) => void;
  onNavigateFolder?: (folderPath: string) => void;
  onSaveAsNote?: (snippet: string) => void;
}

function renderInlineFormatting(
  text: string,
  onNavigateNote?: (path: string) => void,
  onNavigateFolder?: (folderPath: string) => void,
  allFolderPaths: string[] = [],
  allNotePaths: string[] = [],
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
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
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

export function AgentMarkdownContent({
  content,
  isStreaming,
  onNavigateNote,
  onNavigateFolder,
  onSaveAsNote,
}: AgentMarkdownContentProps) {
  const allFolderPaths = useWorkspaceStore((s) => s.allFolderPaths);
  const allNotePaths = useWorkspaceStore((s) => s.allNotePaths);
  if (!content) return null;
  const fmt = (txt: string) =>
    renderInlineFormatting(
      txt,
      onNavigateNote,
      onNavigateFolder,
      allFolderPaths,
      allNotePaths,
    );

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
        const lowerLang = codeLang.toLowerCase();
        if (lowerLang === "widget") {
          elements.push(
            isStreaming ? (
              <AgentWidgetPlaceholder key={`widget-ph-${i}`} />
            ) : (
              <AgentWidgetBlock
                key={`widget-${i}`}
                source={fullCode}
                onSaveAsNote={onSaveAsNote}
              />
            ),
          );
        } else if (lowerLang === "mermaid") {
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
    }
    flushTable();

    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(
        <li key={`li-${i}`} className="agent-md-list-item">
          {fmt(line.slice(2))}
        </li>,
      );
      continue;
    }

    flushList();
    if (!trimmed) continue;

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${i}`} className="agent-md-heading agent-md-heading--h3">
          {fmt(line.slice(4))}
        </h4>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${i}`} className="agent-md-heading agent-md-heading--h2">
          {fmt(line.slice(3))}
        </h3>,
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${i}`} className="agent-md-heading agent-md-heading--h1">
          {fmt(line.slice(2))}
        </h2>,
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="agent-md-paragraph">
          {fmt(line)}
        </p>,
      );
    }
  }

  flushList();
  flushTable();

  if (inCodeBlock && codeBuffer.length > 0) {
    if (codeLang.toLowerCase() === "widget") {
      elements.push(<AgentWidgetPlaceholder key="widget-unterminated" />);
    } else {
      elements.push(
        <AgentCodeBlock
          key="code-unterminated"
          code={codeBuffer.join("\n")}
          lang={codeLang}
          onSaveAsNote={onSaveAsNote}
        />,
      );
    }
  }

  return <div className="agent-markdown-content">{elements}</div>;
}
