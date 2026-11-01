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
      <span class="cm-table-code-badge">Table Source</span>
      <button type="button" class="cm-table-view-btn" aria-label="View rendered table">
        👁️ View Table
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
