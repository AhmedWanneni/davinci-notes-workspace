import { Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { parseLinks } from "@app/indexer";

export interface WikilinkExtensionOptions {
  notePaths: readonly string[];
  sourcePath: string;
  onLinkClick: (targetRaw: string) => void;
}

export function wikilinkExtension(options: WikilinkExtensionOptions) {
  const getWikilinkDecos = (view: EditorView): DecorationSet => {
    const builder: Range<Decoration>[] = [];
    const text = view.state.doc.toString();

    // Use parseLinks from @app/indexer
    const links = parseLinks(text, {
      notePaths: options.notePaths,
      sourcePath: options.sourcePath,
    });

    for (const link of links) {
      if (
        link.type !== "wikilink" ||
        link.start === undefined ||
        link.end === undefined
      ) {
        continue;
      }

      const start = link.start;
      const end = link.end;

      // Start brackets [[
      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-wikilink-brackets",
        }).range(start, start + 2),
      );

      // End brackets ]]
      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-wikilink-brackets",
        }).range(end - 2, end),
      );

      const innerText = text.slice(start + 2, end - 2);
      const pipeIndexInInner = innerText.indexOf("|");

      let linkTextStart = start + 2;
      const linkTextEnd = end - 2;

      if (pipeIndexInInner !== -1) {
        const pipeIndex = start + 2 + pipeIndexInInner;
        // Hide target name and pipe
        builder.push(
          Decoration.mark({
            class: "cm-markdown-syntax cm-wikilink-target-hidden",
          }).range(start + 2, pipeIndex + 1),
        );
        linkTextStart = pipeIndex + 1;
      }

      // Link text itself (either the alias or target name)
      const linkClass = `cm-wikilink ${
        link.resolved ? "cm-wikilink-resolved" : "cm-wikilink-unresolved"
      }`;

      builder.push(
        Decoration.mark({
          class: linkClass,
          attributes: {
            "data-target": link.targetRaw,
            title: link.resolved
              ? `Open note: ${link.targetRaw}`
              : `Create note: ${link.targetRaw} (unresolved)`,
          },
        }).range(linkTextStart, linkTextEnd),
      );
    }

    builder.sort((a, b) => a.from - b.from);
    return Decoration.set(builder);
  };

  return [
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = getWikilinkDecos(view);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = getWikilinkDecos(update.view);
          }
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    ),
    // Click event handler
    ViewPlugin.define((view) => {
      const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target || !target.classList.contains("cm-wikilink")) {
          return;
        }

        // Support clicking to follow link (standard click or Command/Control + click)
        // If not holdingCmd, we can still follow if it is clicked.
        const targetRaw = target.getAttribute("data-target");
        if (targetRaw) {
          event.preventDefault();
          event.stopPropagation();
          options.onLinkClick(targetRaw);
        }
      };

      view.dom.addEventListener("click", handleClick);
      return {
        destroy() {
          view.dom.removeEventListener("click", handleClick);
        },
      };
    }),
  ];
}
