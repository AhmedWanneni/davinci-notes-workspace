import { WidgetType, EditorView } from "@codemirror/view";
import { setMermaidCodeEditing } from "../mermaid/mermaidToolbarWidget";

export class CodeCopyButtonWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly fromPos: number,
  ) {
    super();
  }

  eq(other: CodeCopyButtonWidget): boolean {
    return this.code === other.code && this.fromPos === other.fromPos;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "cm-code-actions";

    const isMermaid = /^(?:\s*)(`{3,}|~{3,})\s*mermaid\b/iu.test(this.code);

    const codeBtn = document.createElement("button");
    codeBtn.type = "button";
    if (isMermaid) {
      codeBtn.className =
        "cm-code-action-btn cm-code-toggle-btn cm-mermaid-view-diagram-btn";
      codeBtn.title = "View diagram";
      codeBtn.setAttribute("aria-label", "View diagram");
      codeBtn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      codeBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        view.dispatch({
          effects: setMermaidCodeEditing.of(null),
        });
        view.focus();
      };
    } else {
      codeBtn.className = "cm-code-action-btn cm-code-toggle-btn";
      codeBtn.title = "View / edit code";
      codeBtn.setAttribute("aria-label", "View / edit code");
      codeBtn.innerHTML = "&lt;/&gt;";
      codeBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        view.dispatch({
          selection: { anchor: this.fromPos },
          scrollIntoView: true,
        });
        view.focus();
      };
    }

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "cm-code-action-btn cm-code-copy-btn";
    copyBtn.title = "Copy code";
    copyBtn.setAttribute("aria-label", "Copy code");
    copyBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h2.5"/></svg>';
    copyBtn.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const clean = this.code
        .replace(/^```[^\n]*\n?/, "")
        .replace(/\n?```$/, "");
      try {
        await navigator.clipboard.writeText(clean);
        copyBtn.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8.5 6.5 12 13 4"/></svg>';
        setTimeout(() => {
          copyBtn.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h2.5"/></svg>';
        }, 2000);
      } catch {
        // Ignore clipboard failure
      }
    };

    wrap.appendChild(codeBtn);
    wrap.appendChild(copyBtn);
    return wrap;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

