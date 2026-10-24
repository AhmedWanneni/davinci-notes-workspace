import { parseFrontmatter } from "@app/indexer";
import {
  parseInlineNodes,
  type BlockNode,
  type OutlineHeading,
  type ParsedMarkdownDocument,
} from "./markdownAst";

export function parseMarkdownDocument(content: string): ParsedMarkdownDocument {
  const { frontmatter, content: body } = parseFrontmatter(content);
  const blocks: BlockNode[] = [];
  const outline: OutlineHeading[] = [];

  const lines = body.split("\n");
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code blocks (```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({
          type: "codeblock",
          code: codeBlockLines.join("\n"),
          language: codeBlockLang,
        });
        inCodeBlock = false;
        codeBlockLang = "";
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Empty lines
    if (!trimmed) {
      continue;
    }

    // 2. Thematic breaks (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      continue;
    }

    // 3. Headings (# to ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = `heading-${i}-${text.toLowerCase().replace(/[^\w-]+/g, "-")}`;
      outline.push({ level, text, id, lineIndex: i });
      blocks.push({
        type: "heading",
        level,
        text,
        id,
        inlines: parseInlineNodes(text),
      });
      continue;
    }

    // 4. Blockquotes (> ...)
    if (line.startsWith(">")) {
      const text = line.replace(/^>\s?/, "");
      blocks.push({
        type: "blockquote",
        inlines: parseInlineNodes(text),
      });
      continue;
    }

    // 5. Checklist tasks (- [ ] or - [x])
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const leadingSpaces = taskMatch[1].length;
      const depth = Math.floor(leadingSpaces / 2);
      const checked = taskMatch[2].toLowerCase() === "x";
      const text = taskMatch[3];
      blocks.push({
        type: "task",
        checked,
        depth,
        inlines: parseInlineNodes(text),
      });
      continue;
    }

    // 6. Lists (ordered or unordered)
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const leadingSpaces = listMatch[1].length;
      const depth = Math.floor(leadingSpaces / 2);
      const isOrdered = /^\d+\./.test(listMatch[2]);
      const index = isOrdered ? parseInt(listMatch[2], 10) : undefined;
      const text = listMatch[3];
      blocks.push({
        type: "list-item",
        ordered: isOrdered,
        depth,
        index,
        inlines: parseInlineNodes(text),
      });
      continue;
    }

    // 7. Regular paragraph
    blocks.push({
      type: "paragraph",
      inlines: parseInlineNodes(line),
    });
  }

  // Flush trailing code block if unterminated
  if (inCodeBlock) {
    blocks.push({
      type: "codeblock",
      code: codeBlockLines.join("\n"),
      language: codeBlockLang,
    });
  }

  return {
    frontmatterRaw: undefined,
    frontmatterData: frontmatter as Record<string, unknown>,
    blocks,
    outline,
  };
}
