import { type ReactNode } from "react";
import { AgentCodeBlock } from "./AgentCodeBlock";
import { AgentMermaidBlock } from "./AgentMermaidBlock";
import { AgentTableBlock } from "./AgentTableBlock";
import { AgentWidgetBlock } from "./AgentWidgetBlock";
import { AgentWidgetPlaceholder } from "./AgentWidgetPlaceholder";
import { renderInlineFormatting } from "./agentMarkdownInlineRenderer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export interface AgentMarkdownContentProps {
  content: string;
  isStreaming?: boolean;
  onNavigateNote?: (notePath: string) => void;
  onNavigateFolder?: (folderPath: string) => void;
  onSaveAsNote?: (snippet: string) => void;
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
    renderInlineFormatting(txt, {
      onNavigateNote,
      onNavigateFolder,
      allFolderPaths,
      allNotePaths,
    });

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
