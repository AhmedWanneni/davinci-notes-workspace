import { WidgetType } from "@codemirror/view";

export class NoteEmbedPlaceholderWidget extends WidgetType {
  constructor(
    readonly message: string,
    readonly className = "cm-note-embed-placeholder",
  ) {
    super();
  }

  eq(other: NoteEmbedPlaceholderWidget): boolean {
    return this.message === other.message && this.className === other.className;
  }

  toDOM(): HTMLElement {
    const el = document.createElement("div");
    el.className = `cm-note-embed-box ${this.className}`;
    el.textContent = this.message;
    return el;
  }
}

export class NoteEmbedPlainLinkWidget extends WidgetType {
  constructor(
    readonly target: string,
    readonly onLinkClick?: (target: string) => void,
  ) {
    super();
  }

  eq(other: NoteEmbedPlainLinkWidget): boolean {
    return this.target === other.target;
  }

  toDOM(): HTMLElement {
    const link = document.createElement("a");
    link.className = "cm-wikilink cm-note-embed-plain-link";
    link.textContent = `[[${this.target}]]`;
    link.href = "#";
    link.onclick = (e) => {
      e.preventDefault();
      this.onLinkClick?.(this.target);
    };
    return link;
  }
}
