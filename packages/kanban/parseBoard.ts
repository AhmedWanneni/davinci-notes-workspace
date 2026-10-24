import type { KanbanBoard, KanbanLane, KanbanCard } from "./kanbanTypes";

function makeLaneId(laneIndex: number, title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
  return `lane-${laneIndex}-${slug || "lane"}`;
}

function makeCardId(laneIndex: number, cardIndex: number, title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
  return `card-${laneIndex}-${cardIndex}-${slug || "card"}`;
}

const CARD_REGEX = /^- \[([- xX])\] ?(.*)$/;
const H2_REGEX = /^## (?!#)\s*(.*)$/;
const SETTINGS_REGEX = /^%%\s*kanban:settings/;

export function parseBoard(text: string): KanbanBoard {
  const lineEnding = text.includes("\r\n") ? "\r\n" : "\n";
  const hasTrailingNewline = text.endsWith("\n");
  const allLines = text.split(/\r?\n/);
  if (hasTrailingNewline && allLines[allLines.length - 1] === "") {
    allLines.pop();
  }

  const preambleLines: string[] = [];
  const epilogueLines: string[] = [];
  const lanes: KanbanLane[] = [];

  let idx = 0;

  // 1. Gather preamble lines (everything before the first H2 lane heading)
  while (idx < allLines.length) {
    const line = allLines[idx];
    if (H2_REGEX.test(line)) {
      break;
    }
    preambleLines.push(line);
    idx += 1;
  }

  // 2. Parse lanes and epilogue
  while (idx < allLines.length) {
    const line = allLines[idx];

    // Check for epilogue block (archive separator or settings comment)
    if (SETTINGS_REGEX.test(line) || isArchiveSeparator(allLines, idx)) {
      while (idx < allLines.length) {
        epilogueLines.push(allLines[idx]);
        idx += 1;
      }
      break;
    }

    if (H2_REGEX.test(line)) {
      const match = line.match(H2_REGEX)!;
      const headingLine = line;
      const title = match[1].trim();
      idx += 1;

      const preLines: string[] = [];
      const cards: KanbanCard[] = [];
      let pendingPreCardLines: string[] = [];

      // Collect lines until next lane or epilogue
      while (idx < allLines.length) {
        const currentLine = allLines[idx];
        if (H2_REGEX.test(currentLine)) break;
        if (
          SETTINGS_REGEX.test(currentLine) ||
          isArchiveSeparator(allLines, idx)
        )
          break;

        const cardMatch = currentLine.match(CARD_REGEX);
        if (cardMatch) {
          const completed = cardMatch[1].toLowerCase() === "x";
          const cardTitle = cardMatch[2];
          const rawLines = [currentLine];
          idx += 1;

          let detectedIndent = "\t";
          const bodyLines: string[] = [];

          // Consume multi-line indented body
          while (idx < allLines.length) {
            const nextLine = allLines[idx];
            if (H2_REGEX.test(nextLine)) break;
            if (
              SETTINGS_REGEX.test(nextLine) ||
              isArchiveSeparator(allLines, idx)
            )
              break;
            if (CARD_REGEX.test(nextLine)) break;

            if (nextLine.startsWith("\t") || nextLine.startsWith(" ")) {
              const indentMatch = nextLine.match(/^(\t| +)/);
              if (indentMatch) detectedIndent = indentMatch[1];
              rawLines.push(nextLine);
              bodyLines.push(nextLine.replace(/^(\t| {2,4})/, ""));
              idx += 1;
            } else if (
              nextLine === "" &&
              hasSubsequentIndentedLine(allLines, idx + 1)
            ) {
              rawLines.push(nextLine);
              bodyLines.push("");
              idx += 1;
            } else {
              break;
            }
          }

          cards.push({
            id: makeCardId(lanes.length, cards.length, cardTitle),
            title: cardTitle,
            body: bodyLines.join(lineEnding),
            completed,
            indent: detectedIndent,
            rawLines,
            preCardLines: pendingPreCardLines,
          });
          pendingPreCardLines = [];
        } else {
          if (cards.length === 0) {
            preLines.push(currentLine);
          } else {
            pendingPreCardLines.push(currentLine);
          }
          idx += 1;
        }
      }

      lanes.push({
        id: makeLaneId(lanes.length, title),
        title,
        headingLine,
        preLines,
        cards,
        postLines: pendingPreCardLines,
      });
    } else {
      // Stray lines before any lane or outside lane
      if (lanes.length === 0) {
        preambleLines.push(line);
      } else {
        lanes[lanes.length - 1].postLines.push(line);
      }
      idx += 1;
    }
  }

  return {
    preambleLines,
    lanes,
    epilogueLines,
    lineEnding,
    hasTrailingNewline,
    rawText: text,
    isModified: false,
  };
}

function hasSubsequentIndentedLine(
  lines: string[],
  startIndex: number,
): boolean {
  for (let i = startIndex; i < lines.length; i += 1) {
    const l = lines[i];
    if (l.startsWith("\t") || l.startsWith(" ")) return true;
    if (l !== "") return false;
  }
  return false;
}

function isArchiveSeparator(lines: string[], index: number): boolean {
  const line = lines[index];
  if (!/^(\*{3,}|-{3,})$/.test(line)) return false;
  for (let i = index + 1; i < lines.length; i += 1) {
    const next = lines[i].trim();
    if (next === "") continue;
    return /^##\s*Archive\b/i.test(next);
  }
  return false;
}
