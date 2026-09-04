import type { PluginEditor } from "@app/plugin-api";

export interface CitationNavigationTarget {
  notePath: string;
  startLine: number;
}

/** Selects the start of a 1-based source line through the stable editor API. */
export function revealCitationLine(
  editor: Pick<PluginEditor, "getContent" | "setSelection">,
  target: CitationNavigationTarget,
): void {
  const lines = editor.getContent().split("\n");
  const line = Math.min(Math.max(Math.trunc(target.startLine), 1), lines.length);
  const offset = lines.slice(0, line - 1).reduce(
    (total, value) => total + value.length + 1,
    0,
  );
  editor.setSelection({ from: offset, to: offset });
}
