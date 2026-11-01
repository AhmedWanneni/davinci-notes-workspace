export interface HoverHintOptions {
  isReadOnly?: boolean;
  onEnterCodeEdit: () => void;
}

export function createHoverHint(options: HoverHintOptions): HTMLElement | null {
  if (options.isReadOnly) return null;

  const hint = document.createElement("div");
  hint.className = "cm-mermaid-hover-hint";
  hint.innerHTML = `
    <button type="button" class="cm-mermaid-hint-btn cm-mermaid-edit-code-btn" title="Edit Mermaid code" aria-label="Edit Mermaid code">
      &lt;/&gt;
    </button>
  `;

  const btn = hint.querySelector<HTMLButtonElement>(
    ".cm-mermaid-edit-code-btn",
  );
  if (btn) {
    btn.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      options.onEnterCodeEdit();
    });
  }

  return hint;
}
