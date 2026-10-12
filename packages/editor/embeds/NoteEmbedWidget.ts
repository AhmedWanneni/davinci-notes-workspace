import type { Extension } from "@codemirror/state";
import { WidgetType } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";
import {
  extractHeadingSection,
  stripFrontmatter,
} from "./noteSectionExtraction";
import { createReadOnlyEmbedView } from "./createReadOnlyEmbedView";
import {
  DEFAULT_EMBED_MAX_LINES,
  type NoteEmbedOptions,
} from "./noteEmbedTypes";

export class NoteEmbedWidget extends WidgetType {
  private embeddedView: EditorView | null = null;
  private observer: IntersectionObserver | null = null;

  constructor(
    readonly path: string,
    readonly heading: string | undefined,
    readonly rawSyntax: string,
    readonly options: NoteEmbedOptions,
    readonly embedExtensionFactory?: (options: NoteEmbedOptions) => Extension,
  ) {
    super();
  }

  eq(other: NoteEmbedWidget): boolean {
    return (
      this.path === other.path &&
      this.heading === other.heading &&
      this.rawSyntax === other.rawSyntax
    );
  }

  toDOM(): HTMLElement {
    const container = document.createElement("div");
    container.className = "cm-note-embed";

    const titleText = this.heading
      ? `${this.pathStem(this.path)} > ${this.heading}`
      : this.pathStem(this.path);

    const header = document.createElement("div");
    header.className = "cm-note-embed__header";
    const titleLink = document.createElement("span");
    titleLink.className = "cm-note-embed__title";
    titleLink.textContent = titleText;
    titleLink.onclick = (e) => {
      e.stopPropagation();
      const target = this.heading ? `${this.path}#${this.heading}` : this.path;
      this.options.onLinkClick?.(target);
    };
    header.appendChild(titleLink);
    container.appendChild(header);

    const body = document.createElement("div");
    body.className = "cm-note-embed__body";
    container.appendChild(body);

    const initialContent = this.options.noteContents?.[this.path];
    if (initialContent !== undefined) {
      this.renderContent(body, initialContent);
    } else if (this.options.loadNoteContent) {
      const loader = () => {
        void this.options.loadNoteContent!(this.path).then((loaded) => {
          if (loaded === null || loaded === undefined) {
            body.className = "cm-note-embed__body cm-note-embed__muted";
            body.textContent = `Note not found: ${this.rawSyntax}`;
          } else {
            this.renderContent(body, loaded);
          }
        });
      };

      if (typeof IntersectionObserver !== "undefined") {
        body.className = "cm-note-embed__body cm-note-embed__loading";
        body.textContent = "Loading embed...";
        this.observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              this.observer?.disconnect();
              this.observer = null;
              loader();
            }
          },
          { rootMargin: "200px" },
        );
        this.observer.observe(container);
      } else {
        loader();
      }
    } else {
      body.className = "cm-note-embed__body cm-note-embed__muted";
      body.textContent = `Note not found: ${this.rawSyntax}`;
    }

    return container;
  }

  private pathStem(path: string): string {
    return path.replace(/\.md$/i, "").split("/").pop() ?? path;
  }

  private renderContent(body: HTMLElement, rawMarkdown: string): void {
    body.innerHTML = "";
    body.className = "cm-note-embed__body";

    let markdownToRender = rawMarkdown;
    if (this.heading) {
      const section = extractHeadingSection(rawMarkdown, this.heading);
      if (!section.found) {
        body.className = "cm-note-embed__body cm-note-embed__muted";
        body.textContent = `Heading not found: #${this.heading} in [[${this.pathStem(this.path)}]]`;
        return;
      }
      markdownToRender = section.content;
    } else {
      markdownToRender = stripFrontmatter(rawMarkdown);
    }

    const lines = markdownToRender.split(/\r?\n/);
    const maxLines = this.options.maxLines ?? DEFAULT_EMBED_MAX_LINES;
    const isOverLimit = lines.length > maxLines;

    let isExpanded = false;
    const editorHost = document.createElement("div");
    editorHost.className = "cm-note-embed__editor-host";
    body.appendChild(editorHost);

    const mountEditor = (doc: string) => {
      this.embeddedView?.destroy();
      const nextChain = [...(this.options.embedChain ?? [this.options.sourcePath ?? ""]), this.path];
      this.embeddedView = createReadOnlyEmbedView(
        editorHost,
        doc,
        {
          ...this.options,
          embedChain: nextChain,
        },
        this.embedExtensionFactory,
      );
    };

    if (isOverLimit) {
      const truncated = lines.slice(0, maxLines).join("\n");
      mountEditor(truncated);

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "cm-note-embed__show-more";
      toggleBtn.textContent = `Show more (${lines.length - maxLines} more lines)`;
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        isExpanded = !isExpanded;
        if (isExpanded) {
          mountEditor(markdownToRender);
          toggleBtn.textContent = "Show less";
        } else {
          mountEditor(truncated);
          toggleBtn.textContent = `Show more (${lines.length - maxLines} more lines)`;
        }
      };
      body.appendChild(toggleBtn);
    } else {
      mountEditor(markdownToRender);
    }
  }

  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.embeddedView?.destroy();
    this.embeddedView = null;
  }
}
