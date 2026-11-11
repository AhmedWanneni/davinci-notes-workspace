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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
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
