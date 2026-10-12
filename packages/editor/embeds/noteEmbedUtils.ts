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
