import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { insertItem } from "./InsertAction";
import { loadInsertRegistry } from "./loadInsertRegistry";
import { isSlashMenuTrigger } from "./SlashMenuTrigger";

export interface SlashMenuOptions {
  enabled: boolean;
  vimMode?: string | null;
}

export { isSlashMenuTrigger } from "./SlashMenuTrigger";

export function slashMenuSource(options: SlashMenuOptions) {
  return async (
    context: CompletionContext,
  ): Promise<CompletionResult | null> => {
    if (context.view?.composing) return null;
    const match = context.matchBefore(/\/[\w -]*$/);
    if (!match) return null;
    const before = context.state.sliceDoc(
      Math.max(0, match.from - 1),
      match.from,
    );
    if (
      !isSlashMenuTrigger(before, options.enabled, options.vimMode, {
        state: context.state,
        pos: match.from,
        view: context.view,
      })
    ) {
      return null;
    }
    const query = match.text.slice(1).toLowerCase();
    const { insertRegistry } = await loadInsertRegistry();
    const completions: Completion[] = insertRegistry
      .filter((item) =>
        [item.label, ...item.keywords].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
      .map((item) => ({
        label: item.label,
        detail: item.group,
        type: "keyword",
        apply: (view: EditorView, _completion, from, to) =>
          insertItem(
            view,
            item,
            EditorSelection.create([EditorSelection.range(from, to)]),
            "",
          ),
      }));
    return completions.length
      ? { from: match.from, options: completions, filter: false }
      : null;
  };
}
