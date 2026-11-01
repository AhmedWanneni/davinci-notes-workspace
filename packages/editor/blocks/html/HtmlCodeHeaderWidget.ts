import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, WidgetType } from "@codemirror/view";

export const setHtmlCodeEditing = StateEffect.define<number | null>();

export const htmlCodeEditingField = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHtmlCodeEditing)) return effect.value;
    }
    return value;
  },
});

export class HtmlCodeHeaderWidget extends WidgetType {
  constructor(readonly blockFrom: number) {
    super();
  }
  eq(other: HtmlCodeHeaderWidget) {
    return this.blockFrom === other.blockFrom;
  }
  toDOM(view: EditorView) {
    const bar = document.createElement("div");
    bar.className = "cm-html-code-bar";
    bar.innerHTML = `
      <span class="cm-html-code-badge">HTML Source</span>
      <button type="button" class="cm-html-view-btn">
        👁️ View HTML
      </button>
    `;
    const btn = bar.querySelector<HTMLButtonElement>(".cm-html-view-btn");
    if (btn) {
      btn.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
      });
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        view.dispatch({ effects: setHtmlCodeEditing.of(null) });
        view.focus();
      });
    }
    return bar;
  }
  ignoreEvent() {
    return true;
  }
}
