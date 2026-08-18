import { parseWikilinkTarget } from "@app/indexer";

const WIKILINK_PATTERN = /\[\[([^\]|]+?)(?:\|([^\]|]+?))?\]\]/g;

/** Update wikilink targets that pointed at `oldStem` to use `newStem`. */
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
