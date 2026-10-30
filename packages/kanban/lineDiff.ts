export interface LineDiffChange {
  type: "added" | "removed" | "modified";
  lineIndex: number;
  oldLine?: string;
  newLine?: string;
}

export function computeLineDiff(
  oldText: string,
  newText: string,
): LineDiffChange[] {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  const changes: LineDiffChange[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i += 1) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === undefined) {
      changes.push({ type: "added", lineIndex: i, newLine });
    } else if (newLine === undefined) {
      changes.push({ type: "removed", lineIndex: i, oldLine });
    } else if (oldLine !== newLine) {
      changes.push({ type: "modified", lineIndex: i, oldLine, newLine });
    }
  }

  return changes;
}
