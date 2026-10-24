import { useMemo } from "react";
import fuzzysort from "fuzzysort";
import type { PaletteTarget } from "./buildPaletteCommands";

export interface PaletteResultItem {
  obj: PaletteTarget;
  highlightedTitle: string;
}

export function usePaletteResults(
  query: string,
  preparedTargets: readonly PaletteTarget[],
): PaletteResultItem[] {
  return useMemo(() => {
    if (!query) {
      const sorted = [...preparedTargets].sort(
        (a, b) => b.recencyScore - a.recencyScore,
      );
      return sorted.slice(0, 30).map((target) => ({
        obj: target,
        highlightedTitle: target.title,
      }));
    }

    const searchResults = fuzzysort.go(query, preparedTargets, {
      key: "title",
      limit: 20,
    });

    return searchResults.map((result) => ({
      obj: result.obj,
      highlightedTitle:
        result.highlight(
          '<mark class="command-palette__highlight">',
          "</mark>",
        ) || result.obj.title,
    }));
  }, [query, preparedTargets]);
}
