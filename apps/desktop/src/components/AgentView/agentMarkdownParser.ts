export type MarkdownBlock =
  | { type: "reasoning"; content: string; isStreaming: boolean }
  | { type: "code"; code: string; language: string; isStreaming: boolean }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "citations"; links: { index: number; url: string; domain: string }[] }
  | { type: "paragraph"; text: string };

export function parseMarkdownBlocks(rawText: string, isStreamingMessage = false): MarkdownBlock[] {
  if (!rawText) return [];
  const blocks: MarkdownBlock[] = [];
  let remaining = rawText;

  // 1. Extract <think> ... </think> or unclosed <think> during stream
  const thinkStartIdx = remaining.indexOf("<think>");
  if (thinkStartIdx !== -1) {
    const thinkEndIdx = remaining.indexOf("</think>", thinkStartIdx);
    if (thinkEndIdx !== -1) {
      const reasoningContent = remaining.slice(thinkStartIdx + 7, thinkEndIdx).trim();
      if (reasoningContent) {
        blocks.push({ type: "reasoning", content: reasoningContent, isStreaming: false });
      }
      remaining = (remaining.slice(0, thinkStartIdx) + "\n" + remaining.slice(thinkEndIdx + 8)).trim();
    } else {
      // Unclosed <think> tag during stream
      const reasoningContent = remaining.slice(thinkStartIdx + 7).trim();
      blocks.push({
        type: "reasoning",
        content: reasoningContent,
        isStreaming: isStreamingMessage,
      });
      remaining = remaining.slice(0, thinkStartIdx).trim();
    }
  }

  if (!remaining) return blocks;

  const lines = remaining.split("\n");
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let listItems: string[] = [];
  let isListOrdered = false;
  let tableLines: string[] = [];
  let quoteLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", ordered: isListOrdered, items: [...listItems] });
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableLines.length >= 2) {
      const parseRow = (line: string) =>
        line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());

      const headers = parseRow(tableLines[0]);
      // tableLines[1] is delimiter row (|---|---|)
      const rows = tableLines.slice(2).map(parseRow);
      blocks.push({ type: "table", headers, rows });
    } else if (tableLines.length === 1) {
      blocks.push({ type: "paragraph", text: tableLines[0] });
    }
    tableLines = [];
  };

  const flushQuote = () => {
    if (quoteLines.length > 0) {
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      quoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (line.trim().startsWith("```")) {
      flushList();
      flushTable();
      flushQuote();

      if (inCode) {
        blocks.push({
          type: "code",
          code: codeLines.join("\n"),
          language: codeLang,
          isStreaming: false,
        });
        inCode = false;
        codeLines = [];
        codeLang = "";
      } else {
        inCode = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // Table rows (| col 1 | col 2 |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList();
      flushQuote();
      tableLines.push(line);
      continue;
    } else if (tableLines.length > 0) {
      flushTable();
    }

    // Blockquote (> text)
    if (line.trim().startsWith(">")) {
      flushList();
      quoteLines.push(line.trim().replace(/^>\s?/, ""));
      continue;
    } else if (quoteLines.length > 0) {
      flushQuote();
    }

    // Lists (- item or 1. item)
    const bulletMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (bulletMatch) {
      const isOrdered = /^\d+\./.test(bulletMatch[2]);
      if (listItems.length > 0 && isListOrdered !== isOrdered) {
        flushList();
      }
      isListOrdered = isOrdered;
      listItems.push(bulletMatch[3]);
      continue;
    } else if (listItems.length > 0) {
      flushList();
    }

    // Headings
    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() });
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "heading", level: 1, text: line.slice(2).trim() });
    } else if (line.trim().length > 0) {
      // Check for citations link list: [1] http://... or [2] https://...
      const citationMatch = line.trim().match(/^\[(\d+)\]\s+(https?:\/\/[^\s]+)/);
      if (citationMatch) {
        try {
          const url = citationMatch[2];
          const domain = new URL(url).hostname.replace(/^www\./, "");
          blocks.push({
            type: "citations",
            links: [{ index: parseInt(citationMatch[1], 10), url, domain }],
          });
        } catch {
          blocks.push({ type: "paragraph", text: line });
        }
      } else {
        blocks.push({ type: "paragraph", text: line });
      }
    }
  }

  // Flush remaining buffers
  if (inCode) {
    blocks.push({
      type: "code",
      code: codeLines.join("\n"),
      language: codeLang,
      isStreaming: isStreamingMessage,
    });
  }
  flushTable();
  flushList();
  flushQuote();

  return blocks;
}
