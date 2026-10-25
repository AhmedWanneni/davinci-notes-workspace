export interface DiffLine {
  kind: "added" | "removed" | "unchanged";
  text: string;
}

export function lineDiff(before: string, after: string): DiffLine[] {
  const left = before ? before.split("\n") : [];
  const right = after ? after.split("\n") : [];
  const table = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        left[i] === right[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      result.push({ kind: "unchanged", text: left[i++] });
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ kind: "removed", text: left[i++] });
    } else {
      result.push({ kind: "added", text: right[j++] });
    }
  }
  while (i < left.length) result.push({ kind: "removed", text: left[i++] });
  while (j < right.length) result.push({ kind: "added", text: right[j++] });
  return result;
}
