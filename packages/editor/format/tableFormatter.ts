export function formatTableLines(lines: string[]): string[] {
  if (lines.length < 2) return lines;

  const parsedRows: string[][] = [];
  const alignments: Array<"left" | "center" | "right" | "none"> = [];

  for (let r = 0; r < lines.length; r += 1) {
    const raw = lines[r]!.trim();
    if (!raw.includes("|")) return lines;

    const trimmed = raw.replace(/^\|/, "").replace(/\|$/, "");
    const cells = trimmed.split("|").map((c) => c.trim());
    parsedRows.push(cells);

    if (r === 1) {
      for (const cell of cells) {
        const left = cell.startsWith(":");
        const right = cell.endsWith(":");
        if (left && right) alignments.push("center");
        else if (left) alignments.push("left");
        else if (right) alignments.push("right");
        else alignments.push("none");
      }
    }
  }

  const numCols = Math.max(...parsedRows.map((r) => r.length));
  if (numCols === 0) return lines;

  const colWidths = new Array<number>(numCols).fill(3);

  for (let r = 0; r < parsedRows.length; r += 1) {
    if (r === 1) continue; // skip delimiter row for width calculation
    const row = parsedRows[r]!;
    for (let c = 0; c < numCols; c += 1) {
      const cell = row[c] ?? "";
      colWidths[c] = Math.max(colWidths[c]!, cell.length);
    }
  }

  const formatted: string[] = [];

  for (let r = 0; r < parsedRows.length; r += 1) {
    const row = parsedRows[r]!;
    if (r === 1) {
      const delims = colWidths.map((w, c) => {
        const align = alignments[c] ?? "none";
        if (align === "center") {
          return ":" + "-".repeat(Math.max(1, w - 2)) + ":";
        }
        if (align === "left") {
          return ":" + "-".repeat(Math.max(2, w - 1));
        }
        if (align === "right") {
          return "-".repeat(Math.max(2, w - 1)) + ":";
        }
        return "-".repeat(Math.max(3, w));
      });
      formatted.push(`| ${delims.join(" | ")} |`);
    } else {
      const paddedCells = colWidths.map((w, c) => {
        const cell = row[c] ?? "";
        const align = alignments[c] ?? "none";
        if (align === "right") {
          return cell.padStart(w, " ");
        }
        return cell.padEnd(w, " ");
      });
      formatted.push(`| ${paddedCells.join(" | ")} |`);
    }
  }

  return formatted;
}

export function formatMarkdownTables(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let tableBuffer: string[] = [];

  const isTableRow = (line: string): boolean => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith("|") ||
      (trimmed.includes("|") &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith(">"))
    );
  };

  const isDelimiterRow = (line: string): boolean => {
    const trimmed = line.trim();
    return /^\|?[\s:-]+(?:\|[\s:-]+)+\|?$/.test(trimmed);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (isTableRow(line)) {
      tableBuffer.push(line);
    } else {
      if (tableBuffer.length >= 2 && isDelimiterRow(tableBuffer[1]!)) {
        result.push(...formatTableLines(tableBuffer));
      } else {
        result.push(...tableBuffer);
      }
      tableBuffer = [];
      result.push(line);
    }
  }

  if (tableBuffer.length >= 2 && isDelimiterRow(tableBuffer[1]!)) {
    result.push(...formatTableLines(tableBuffer));
  } else {
    result.push(...tableBuffer);
  }

  return result.join("\n");
}
