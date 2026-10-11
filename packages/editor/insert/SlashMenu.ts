import type { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { insertItem } from "./InsertAction";
import { loadInsertRegistry } from "./loadInsertRegistry";

export interface SlashMenuOptions {
  enabled: boolean;
  vimMode?: string | null;
}

export function isSlashMenuTrigger(before: string, enabled: boolean, vimMode?: string | null) {
  if (!enabled || (vimMode && vimMode !== "INSERT" && vimMode !== "REPLACE")) return false;
  return before.length === 0 || /\s$/.test(before);
}

export function slashMenuSource(options: SlashMenuOptions) {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const match = context.matchBefore(/\/[\w -]*$/);
    if (!match || !isSlashMenuTrigger(context.state.sliceDoc(0, match.from), options.enabled, options.vimMode)) return null;
    const query = match.text.slice(1).toLowerCase();
    const { insertRegistry } = await loadInsertRegistry();
    const completions: Completion[] = insertRegistry
      .filter((item) => [item.label, ...item.keywords].some((value) => value.toLowerCase().includes(query)))
      .map((item) => ({
        label: item.label,
        detail: item.group,
        type: "keyword",
        apply: (view: EditorView, _completion, from, to) => insertItem(view, item, EditorSelection.create([EditorSelection.range(from, to)]), ""),
      }));
    return completions.length ? { from: match.from, options: completions, filter: false } : null;
  };
}
