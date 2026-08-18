import { parseFrontmatter } from "@app/indexer";

/** Rewrite the first H1 to match a new filename stem (filename → H1 sync). */
export function syncH1ToFilename(content: string, newStem: string): string {
  const { frontmatter, content: body } = parseFrontmatter(content);
  const lines = body.split("\n");
  let replaced = false;

  const nextLines = lines.map((line) => {
    if (!replaced && /^#\s+/.test(line.trim())) {
      replaced = true;
      return `# ${newStem}`;
    }
    return line;
  });

  if (!replaced) {
    nextLines.unshift(`# ${newStem}`, "");
  }

  const nextBody = nextLines.join("\n");
  const frontmatterKeys = Object.keys(frontmatter);
  if (frontmatterKeys.length === 0) {
    return nextBody;
  }

  const yaml = frontmatterKeys
    .map((key) => `${key}: ${String(frontmatter[key])}`)
    .join("\n");
  return `---\n${yaml}\n---\n\n${nextBody}`;
}
