export interface HoverHintOptions {
  isReadOnly?: boolean;
  onEnterCodeEdit: () => void;
}

export function createHoverHint(options: HoverHintOptions): HTMLElement | null {
  if (options.isReadOnly) return null;

  const hint = document.createElement("div");
  hint.className = "cm-mermaid-hover-hint";
  hint.innerHTML = `
    <button type="button" class="cm-mermaid-hint-btn cm-mermaid-edit-code-btn" title="Edit Mermaid code">
      <span class="cm-mermaid-btn-icon">💻</span> Edit code
    </button>
  `;

  hint
    .querySelector(".cm-mermaid-edit-code-btn")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      options.onEnterCodeEdit();
    });

  return hint;
}
