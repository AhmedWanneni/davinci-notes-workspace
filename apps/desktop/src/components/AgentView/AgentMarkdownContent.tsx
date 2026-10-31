import { memo, useMemo } from "react";
import { parseMarkdownBlocks, type MarkdownBlock } from "./agentMarkdownParser";
import { renderInlineTokens } from "./agentInlineRenderer";
import { AgentCodeBlock } from "./AgentCodeBlock";
import { AgentReasoningBlock } from "./AgentReasoningBlock";
import { AgentCitationsList } from "./AgentCitationsList";

export interface AgentMarkdownContentProps {
  content: string;
  isStreaming?: boolean;
  onNavigateNote?: (notePath: string) => void;
}

interface BlockViewProps {
  block: MarkdownBlock;
  onNavigateNote?: (notePath: string) => void;
}

const MarkdownBlockView = memo(function MarkdownBlockView({
  block,
  onNavigateNote,
}: BlockViewProps) {
  switch (block.type) {
    case "reasoning":
      return (
        <AgentReasoningBlock
          content={block.content}
          isStreaming={block.isStreaming}
        />
      );

    case "code":
      return (
        <AgentCodeBlock
          code={block.code}
          language={block.language}
          isStreaming={block.isStreaming}
        />
      );

    case "table":
      return (
        <div className="agent-md-table-wrap">
          <table className="agent-md-table">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i}>{renderInlineTokens(h, onNavigateNote)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>
                      {renderInlineTokens(cell, onNavigateNote)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "blockquote":
      return (
        <blockquote className="agent-md-blockquote">
          {renderInlineTokens(block.text, onNavigateNote)}
        </blockquote>
      );

    case "list":
      if (block.ordered) {
        return (
          <ol className="agent-md-list agent-md-list--ordered">
            {block.items.map((item, i) => (
              <li key={i} className="agent-md-list-item">
                {renderInlineTokens(item, onNavigateNote)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="agent-md-list agent-md-list--unordered">
          {block.items.map((item, i) => (
            <li key={i} className="agent-md-list-item">
              {renderInlineTokens(item, onNavigateNote)}
            </li>
          ))}
        </ul>
      );

    case "heading": {
      const HeadingTag = `h${block.level + 1}` as "h2" | "h3" | "h4";
      return (
        <HeadingTag
          className={`agent-md-heading agent-md-heading--h${block.level}`}
        >
          {renderInlineTokens(block.text, onNavigateNote)}
        </HeadingTag>
      );
    }

    case "citations":
      return <AgentCitationsList links={block.links} />;

    case "paragraph":
      return (
        <p className="agent-md-paragraph">
          {renderInlineTokens(block.text, onNavigateNote)}
        </p>
      );

    default:
      return null;
  }
});

export function AgentMarkdownContent({
  content,
  isStreaming = false,
  onNavigateNote,
}: AgentMarkdownContentProps) {
  const blocks = useMemo(
    () => parseMarkdownBlocks(content, isStreaming),
    [content, isStreaming],
  );

  if (!content && !isStreaming) return null;

  return (
    <div className="agent-markdown-content">
      {blocks.map((block, idx) => (
        <MarkdownBlockView
          key={`${block.type}-${idx}`}
          block={block}
          onNavigateNote={onNavigateNote}
        />
      ))}
    </div>
  );
}
