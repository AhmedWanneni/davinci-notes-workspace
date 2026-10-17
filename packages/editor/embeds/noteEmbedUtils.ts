export function pathStem(path: string): string {
  return path.replace(/\.md$/i, "").split("/").pop() ?? path;
}

export function matchesNotePath(targetPath: string, testPath: string): boolean {
  const normTarget = targetPath.replace(/\\/g, "/").replace(/\.md$/i, "").toLowerCase();
  const normTest = testPath.replace(/\\/g, "/").replace(/\.md$/i, "").toLowerCase();
  return (
    normTarget === normTest ||
    normTarget.endsWith(`/${normTest}`) ||
    normTest.endsWith(`/${normTarget}`)
  );
}

export function resolveWikilinkTargetForPath(
  path: string,
  allPaths: readonly string[],
): string {
  const stem = pathStem(path);
  const duplicateStems = allPaths.filter((p) => {
    return pathStem(p).toLowerCase() === stem.toLowerCase();
  });
  if (duplicateStems.length > 1) {
    return path.replace(/\.md$/i, "");
  }
  return stem;
}

export function extractNoteHeadings(content: string): Array<{ heading: string; level: number }> {
  const headings: Array<{ heading: string; level: number }> = [];
  const lines = content.split(/\r?\n/);
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      headings.push({
        level: match[1]!.length,
        heading: match[2]!.trim(),
      });
    }
  }
  return headings;
}
