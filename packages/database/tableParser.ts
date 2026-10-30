export function isTableDelimiter(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  const parts = splitPipes(line);
  if (parts.length === 0) return false;
  return parts.every((p) => /^:?-+:?$/.test(p.trim()));
}

export function splitPipes(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let isEscaped = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (isEscaped) {
      current += char;
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      current += char;
      continue;
    }

    if (char === "|") {
      parts.push(current);
      current = "";
      continue;
    }

    current += char;
  }
  parts.push(current);

  // If table line started with |, first part before pipe was empty
  if (parts.length > 0 && parts[0].trim() === "") {
    parts.shift();
  }
  // If table line ended with |, last part after pipe was empty
  if (parts.length > 0 && parts[parts.length - 1].trim() === "") {
    parts.pop();
  }

  return parts;
}

export function parseRowCells(line: string): string[] {
  const rawPipes = splitPipes(line);
  return rawPipes.map((rawCell) => {
    // Unescape escaped pipes for display: \| -> |
    const unescaped = rawCell.replace(/\\\|/g, "|");
    return unescaped.trim();
  });
}

export function serializeRowCells(cells: string[]): string {
  const formattedCells = cells.map((c) => {
    // Replace raw newlines with <br>
    const singleLine = c.replace(/\r?\n/g, "<br>");
    // Escape unescaped pipes
    const escaped = singleLine.replace(/(?<!\\)\|/g, "\\|");
    return ` ${escaped} `;
  });
  return `|${formattedCells.join("|")}|`;
}
