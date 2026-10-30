import {
  closeCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSection,
} from "@codemirror/autocomplete";
import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { runInsertItem } from "./insertDialogStore";
import { loadInsertRegistry } from "./loadInsertRegistry";
import { isSlashMenuTrigger } from "./SlashMenuTrigger";
import { getRecentInsertIds } from "./recentInsertStore";
import { createSlashIconElement } from "./slashIcons";
import type { InsertItem } from "./InsertItem";

export interface SlashMenuOptions {
  enabled: boolean;
  vimMode?: string | null;
}

export { isSlashMenuTrigger } from "./SlashMenuTrigger";

const SUGGESTED_SECTION: CompletionSection = {
  name: "Suggested",
  rank: 1,
};

const BASIC_BLOCKS_SECTION: CompletionSection = {
  name: "Basic blocks",
  rank: 2,
};

const MEDIA_SECTION: CompletionSection = {
  name: "Media & Embeds",
  rank: 3,
};

const ADVANCED_SECTION: CompletionSection = {
  name: "Advanced & Data",
  rank: 4,
};

const ACTIONS_SECTION: CompletionSection = {
  name: "Actions",
  rank: 99,
  header: () => {
    const el = document.createElement("li");
    el.className = "cm-completionSection cm-completionSection--divider";
    return el;
  },
};

function resolveSection(item: InsertItem): CompletionSection {
  if (item.id === "ai-meeting-notes" || item.id === "html-block") {
    return SUGGESTED_SECTION;
  }
  if (
    item.group === "Basics" ||
    item.id === "text" ||
    item.id.startsWith("heading-") ||
    item.id.includes("list") ||
    item.id === "quote" ||
    item.id === "divider" ||
    item.id === "reminder"
  ) {
    return BASIC_BLOCKS_SECTION;
  }
  if (item.group === "Media") {
    return MEDIA_SECTION;
  }
  return ADVANCED_SECTION;
}

export const slashMenuAddToOptions = [
  {
    render: (completion: Completion) =>
      createSlashIconElement(completion.type ?? "text"),
    position: 10,
  },
  {
    render: (completion: Completion) => {
      if (completion.type === "html-block") {
        const badge = document.createElement("span");
        badge.className = "cm-slash-badge";
        badge.textContent = "New";
        return badge;
      }
      return null;
    },
    position: 60,
  },
];

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
      detail: item.shortcut,
      type: item.id,
      section: resolveSection(item),
      boost:
        item.id === "ai-meeting-notes" || item.id === "html-block"
          ? 90
          : item.group === "Basics"
            ? 50
            : 10,
      apply: (view: EditorView, _completion, from, to) => {
        return runInsertItem(
          view,
          item,
          EditorSelection.create([EditorSelection.range(from, to)]),
          "",
        );
      },
    }));

    if (!query || "close menu".includes(query) || "esc".includes(query)) {
      completions.push({
        label: "Close menu",
        detail: "esc",
        type: "close-menu",
        section: ACTIONS_SECTION,
        boost: -100,
        apply: (view: EditorView, _completion, from, to) => {
          view.dispatch({ changes: { from, to, insert: "" } });
          closeCompletion(view);
        },
      });
    }

    return completions.length
      ? { from: match.from, options: completions, filter: false }
      : null;
  };
}
