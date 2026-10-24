export type InlineNode =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "strike"; text: string }
  | { type: "code"; text: string }
  | { type: "wikilink"; raw: string; target: string; displayText?: string }
  | { type: "tag"; tag: string }
  | { type: "link"; text: string; url: string };

export type BlockNode =
  | {
      type: "heading";
      level: number;
      text: string;
      inlines: InlineNode[];
      id: string;
    }
  | { type: "paragraph"; inlines: InlineNode[] }
  | { type: "blockquote"; inlines: InlineNode[] }
  | { type: "codeblock"; code: string; language?: string }
  | { type: "task"; checked: boolean; depth?: number; inlines: InlineNode[] }
  | {
      type: "list-item";
      ordered: boolean;
      depth?: number;
      index?: number;
      inlines: InlineNode[];
    }
  | { type: "divider" };

export interface OutlineHeading {
  level: number;
  text: string;
  id: string;
  lineIndex: number;
}

export interface ParsedMarkdownDocument {
  frontmatterRaw?: string;
  frontmatterData?: Record<string, unknown>;
  blocks: BlockNode[];
  outline: OutlineHeading[];
}

export function parseInlineNodes(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  // Regex to match inline tokens: wikilinks, markdown links, tags, bold, strike, code, italic
  const tokenRegex =
    /(!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\])|(\[([^\]]+)\]\(([^)]+)\))|(#[\w/_-]+)|(`[^`]+`)|(\*\*([^*]+)\*\*)|(~~([^~]+)~~)|(\*([^*]+)\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({
        type: "text",
        text: text.substring(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // Wikilink [[target|display]]
      const isEmbed = match[1].startsWith("!");
      if (!isEmbed) {
        nodes.push({
          type: "wikilink",
          raw: match[1],
          target: match[2].trim(),
          displayText: match[3]?.trim(),
        });
      } else {
        nodes.push({ type: "text", text: match[1] });
      }
    } else if (match[4]) {
      // Markdown link [text](url)
      nodes.push({ type: "link", text: match[5], url: match[6] });
    } else if (match[7]) {
      // Tag #tag
      nodes.push({ type: "tag", tag: match[7] });
    } else if (match[8]) {
      // Inline code `code`
      nodes.push({ type: "code", text: match[8].slice(1, -1) });
    } else if (match[9]) {
      // Bold **text**
      nodes.push({ type: "bold", text: match[10] });
    } else if (match[11]) {
      // Strikethrough ~~text~~
      nodes.push({ type: "strike", text: match[12] });
    } else if (match[13]) {
      // Italic *text*
      nodes.push({ type: "italic", text: match[14] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.substring(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}
