import { WidgetType } from "@codemirror/view";

export class MermaidCodeHeaderWidget extends WidgetType {
  constructor(readonly onViewDiagram: () => void) {
    super();
  }

  eq() {
    return true;
  }

  toDOM() {
    const bar = document.createElement("div");
    bar.className = "cm-mermaid-code-bar";
    bar.innerHTML = `
      <span class="cm-mermaid-code-badge">Mermaid Source</span>
      <button type="button" class="cm-mermaid-btn cm-mermaid-btn-primary cm-mermaid-view-diagram-btn">
        👁️ View Diagram
      </button>
    `;

    bar
      .querySelector(".cm-mermaid-view-diagram-btn")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onViewDiagram();
      });

    return bar;
  }
}
