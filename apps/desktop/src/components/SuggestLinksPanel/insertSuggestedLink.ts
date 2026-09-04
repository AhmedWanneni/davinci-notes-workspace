import type { EditorPluginAdapter } from "@app/editor";

/** Uses the same editor insertion boundary as typed text and plugin commands. */
export function insertSuggestedLink(
  editor: Pick<EditorPluginAdapter, "insertText">,
  targetPath: string,
): void {
  editor.insertText(`[[${targetPath}]]`);
}
