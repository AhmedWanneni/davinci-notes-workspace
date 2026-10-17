import { parseWikilinkTarget } from "@app/indexer";

const WIKILINK_PATTERN = /\[\[([^\]|]+?)(?:\|([^\]|]+?))?\]\]/g;

/**
 * Updates wikilinks in markdown content that point to `oldStem` to point to `newStem`.
 * Preserves headings (#heading), block identifiers (#^blockId), and aliases (|alias).
 */
export function updateWikilinksForRename(
  content: string,
  oldStem: string,
  newStem: string,
): string {
  if (oldStem.toLowerCase() === newStem.toLowerCase()) {
    return content;
  }

  return content.replace(
    WIKILINK_PATTERN,
    (match, targetPart: string, displayPart?: string) => {
      const { noteTarget, heading, blockId } = parseWikilinkTarget(targetPart);
      if (noteTarget.toLowerCase() !== oldStem.toLowerCase()) {
        return match;
      }

      let nextTarget = newStem;
      if (blockId) {
        nextTarget += `#^${blockId}`;
      } else if (heading) {
        nextTarget += `#${heading}`;
      }

      if (displayPart !== undefined) {
        return `[[${nextTarget}|${displayPart}]]`;
      }
      return `[[${nextTarget}]]`;
    },
  );
}
