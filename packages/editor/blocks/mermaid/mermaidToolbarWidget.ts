import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, WidgetType } from "@codemirror/view";

export const setMermaidCodeEditing = StateEffect.define<number | null>();

export const mermaidCodeEditingField = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setMermaidCodeEditing)) return effect.value;
    }
    return value;
  },
});

export class MermaidCodeHeaderWidget extends WidgetType {
  constructor(
    readonly blockFrom?: number,
    readonly onViewDiagram?: () => void,
  ) {
    super();
  }

  eq(other: MermaidCodeHeaderWidget) {
    return this.blockFrom === other.blockFrom;
  }

  toDOM(view: EditorView) {
    const bar = document.createElement("div");
    bar.className = "cm-mermaid-code-bar";
    bar.innerHTML = `
      <span class="cm-mermaid-code-badge">Mermaid</span>
      <button type="button" class="cm-mermaid-btn cm-mermaid-view-diagram-btn" title="View diagram" aria-label="View diagram">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    `;

    bar
      .querySelector(".cm-mermaid-view-diagram-btn")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.onViewDiagram) {
          this.onViewDiagram();
        } else {
          view.dispatch({ effects: setMermaidCodeEditing.of(null) });
          view.focus();
        }
      });

    return bar;
  }

  ignoreEvent() {
    return true;
  }
}


