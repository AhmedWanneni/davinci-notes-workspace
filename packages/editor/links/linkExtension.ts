import {
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import {
  AUTOLINK_REGEX,
  isExternalUrl,
  MARKDOWN_LINK_REGEX,
  resolveInternalMarkdownFallback,
  sanitizeLinkDestination,
} from "./linkParsing";
import {
  buildLinkDecorations,
  type LinkExtensionOptions,
} from "./linkDecorations";

export {
  AUTOLINK_REGEX,
  isExternalUrl,
  MARKDOWN_LINK_REGEX,
  resolveInternalMarkdownFallback,
  sanitizeLinkDestination,
  type LinkExtensionOptions,
};

export function linkExtension(options: LinkExtensionOptions) {
  const handleExternalNavigation = (url: string) => {
    const trimmed = url.trim();
    const safeUrl = trimmed.includes(" ") ? encodeURI(trimmed) : trimmed;
    if (options.onExternalLinkClick) {
      options.onExternalLinkClick(safeUrl);
    } else if (typeof window !== "undefined") {
      window.open(safeUrl, "_blank", "noopener,noreferrer");
    }
  };

  return [
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = buildLinkDecorations(view, options);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = buildLinkDecorations(update.view, options);
          }
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    ),
    ViewPlugin.define((view) => {
      const handleMouseDown = (event: MouseEvent) => {
        if (event.button !== 0 && event.button !== 1) return;
        const target = (event.target as HTMLElement)?.closest(
          ".cm-wikilink, .cm-link",
        ) as HTMLElement | null;
        if (!target) return;

        // Prevent CodeMirror from moving cursor into link on mousedown while allowing click events to dispatch
        event.preventDefault();
      };

      const handleClick = (event: MouseEvent) => {
        const target = (event.target as HTMLElement)?.closest(
          ".cm-wikilink, .cm-link",
        ) as HTMLElement | null;
        if (!target) return;

        if (target.classList.contains("cm-link-external")) {
          const url = target.getAttribute("data-url");
          if (url) {
            event.preventDefault();
            event.stopPropagation();
            handleExternalNavigation(url);
          }
          return;
        }

        const targetRaw = target.getAttribute("data-target");
        if (targetRaw) {
          event.preventDefault();
          event.stopPropagation();
          options.onLinkClick(targetRaw);
        }
      };

      view.dom.addEventListener("mousedown", handleMouseDown, true);
      view.dom.addEventListener("click", handleClick);
      return {
        destroy() {
          view.dom.removeEventListener("mousedown", handleMouseDown, true);
          view.dom.removeEventListener("click", handleClick);
        },
      };
    }),
  ];
}

export const wikilinkExtension = linkExtension;
