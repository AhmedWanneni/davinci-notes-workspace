import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, WidgetType } from "@codemirror/view";

export const setTableCodeEditing = StateEffect.define<number | null>();

export const tableCodeEditingField = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setTableCodeEditing)) return effect.value;
    }
    return value;
  },
});

export class TableCodeHeaderWidget extends WidgetType {
  constructor(readonly tableFrom: number) {
    super();
  }

  eq(other: TableCodeHeaderWidget) {
    return this.tableFrom === other.tableFrom;
  }

  toDOM(view: EditorView) {
    const bar = document.createElement("div");
    bar.className = "cm-table-code-bar";
    bar.innerHTML = `
      <span class="cm-table-code-badge">Table</span>
      <button type="button" class="cm-table-view-btn" title="Preview mode" aria-label="Preview mode">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>Preview</span>
      </button>
    `;
    const btn = bar.querySelector<HTMLButtonElement>(".cm-table-view-btn");
    if (btn) {
      btn.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        view.dispatch({ effects: setTableCodeEditing.of(null) });
        view.focus();
      });
    }
    return bar;
  }

  ignoreEvent() {
    return true;
  }
}
