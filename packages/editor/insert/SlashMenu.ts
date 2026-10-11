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
import { getRecentInsertIds, recordRecentInsert } from "./recentInsertStore";

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
    const recentIds = getRecentInsertIds();
    const matching = insertRegistry.filter((item) =>
      [item.label, ...item.keywords].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
    const sorted = [...matching].sort((a, b) => {
      const aIdx = recentIds.indexOf(a.id);
      const bIdx = recentIds.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
    const completions: Completion[] = sorted.map((item) => ({
      label: item.label,
      detail: item.group,
      type: "keyword",
      apply: (view: EditorView, _completion, from, to) => {
        recordRecentInsert(item.id);
        return insertItem(
          view,
          item,
          EditorSelection.create([EditorSelection.range(from, to)]),
          "",
        );
      },
    }));
    return completions.length
      ? { from: match.from, options: completions, filter: false }
      : null;
  };
}
