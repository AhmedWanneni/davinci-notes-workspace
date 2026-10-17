import type { HighlightRecord } from "./HighlightRecord";

function textNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      return parent?.closest("script,style,[data-davinci-highlight]") === null
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    nodes.push(node as Text);
  }
  return nodes;
}

function occurrenceBefore(
  source: string,
  needle: string,
  offset: number,
): number {
  let count = 0;
  let index = source.indexOf(needle);
  while (index >= 0 && index < offset) {
    count += 1;
    index = source.indexOf(needle, index + needle.length);
  }
  return count;
}

/** Read the active text selection as a portable quote anchor. */
export function selectedHighlight(
  document: Document,
): Omit<HighlightRecord, "id" | "url" | "createdAt"> | undefined {
  const selection = document.defaultView?.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
  const text = selection?.toString().trim() ?? "";
  if (range === undefined || range.collapsed || text.length === 0)
    return undefined;

  const nodes = textNodes(document.body);
  const source = nodes.map((node) => node.data).join("");
  let start = 0;
  for (const node of nodes) {
    if (node === range.startContainer) {
      start += range.startOffset;
      break;
    }
    start += node.data.length;
  }
  return { text, occurrence: occurrenceBefore(source, text, start) };
}

/** Restore quote anchors without throwing when a page changed underneath them. */
export function restoreHighlights(
  document: Document,
  records: readonly HighlightRecord[],
): number {
  const nodes = textNodes(document.body);
  const source = nodes.map((node) => node.data).join("");
  let offset = 0;
  const positioned = nodes.map((node) => {
    const start = offset;
    offset += node.data.length;
    return { node, start, end: offset };
  });
  let restored = 0;

  for (const record of records) {
    let position = -1;
    let searchFrom = 0;
    for (let count = 0; count <= record.occurrence; count += 1) {
      position = source.indexOf(record.text, searchFrom);
      if (position < 0) break;
      searchFrom = position + record.text.length;
    }
    if (position < 0) continue;
    const end = position + record.text.length;
    for (const entry of [...positioned].reverse()) {
      if (entry.start >= end || entry.end <= position) continue;
      const range = document.createRange();
      range.setStart(entry.node, Math.max(0, position - entry.start));
      range.setEnd(
        entry.node,
        Math.min(entry.node.data.length, end - entry.start),
      );
      const mark = document.createElement("mark");
      mark.dataset.davinciHighlight = record.id;
      range.surroundContents(mark);
    }
    restored += 1;
  }
  return restored;
}
