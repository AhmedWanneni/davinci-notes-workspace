import { Range } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { parseLinks } from "@app/indexer";
import {
  AUTOLINK_REGEX,
  isExternalUrl,
  MARKDOWN_LINK_REGEX,
  resolveInternalMarkdownFallback,
  sanitizeLinkDestination,
} from "./linkParsing";

export interface LinkExtensionOptions {
  notePaths: readonly string[];
  sourcePath: string;
  onLinkClick: (targetRaw: string) => void;
  onExternalLinkClick?: (url: string) => void;
}

export function buildLinkDecorations(
  view: EditorView,
  options: LinkExtensionOptions,
): DecorationSet {
  const builder: Range<Decoration>[] = [];
  const state = view.state;

  for (const { from, to } of view.visibleRanges) {
    const lineStart = state.doc.lineAt(from).from;
    const lineEnd = state.doc.lineAt(to).to;
    const chunkText = state.doc.sliceString(lineStart, lineEnd);
    const occupiedRanges: { from: number; to: number }[] = [];

    // 1. Parse Wikilinks
    const links = parseLinks(chunkText, {
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

      const start = lineStart + link.start;
      const end = lineStart + link.end;
      occupiedRanges.push({ from: start, to: end });

      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-marker-hidden cm-wikilink-brackets",
        }).range(start, start + 2),
      );
      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-marker-hidden cm-wikilink-brackets",
        }).range(end - 2, end),
      );

      const innerText = chunkText.slice(link.start + 2, link.end - 2);
      const pipeIndexInInner = innerText.indexOf("|");

      let linkTextStart = start + 2;
      const linkTextEnd = end - 2;

      if (pipeIndexInInner !== -1) {
        const pipeIndex = start + 2 + pipeIndexInInner;
        builder.push(
          Decoration.mark({
            class:
              "cm-markdown-syntax cm-marker-hidden cm-wikilink-target-hidden",
          }).range(start + 2, pipeIndex + 1),
        );
        linkTextStart = pipeIndex + 1;
      }

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

    // 2. Parse Markdown Links [text](url)
    for (const match of chunkText.matchAll(MARKDOWN_LINK_REGEX)) {
      const start = lineStart + match.index!;
      const end = start + match[0].length;
      occupiedRanges.push({ from: start, to: end });

      const rawText = match[1] ?? "";
      const rawDest = match[2] ?? "";
      const dest = sanitizeLinkDestination(rawDest);

      const openBracketEnd = start + 1;
      const textEnd = openBracketEnd + rawText.length;

      // Hide opening bracket [
      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-marker-hidden cm-link-mark",
        }).range(start, openBracketEnd),
      );

      // Hide ](destination)
      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-marker-hidden cm-link-target-hidden",
        }).range(textEnd, end),
      );

      if (isExternalUrl(dest)) {
        builder.push(
          Decoration.mark({
            class: "cm-link cm-link-external",
            attributes: {
              "data-url": dest,
              title: `Open external link: ${dest}`,
            },
          }).range(openBracketEnd, textEnd),
        );
      } else {
        const indexerLink = links.find(
          (l) => l.start === match.index! && l.type === "markdown",
        );
        const resolution = indexerLink
          ? { target: indexerLink.target, resolved: indexerLink.resolved }
          : resolveInternalMarkdownFallback(
              dest,
              options.sourcePath,
              options.notePaths,
            );
        const linkClass = `cm-link cm-link-internal ${
          resolution.resolved ? "cm-link-resolved" : "cm-link-unresolved"
        }`;
        builder.push(
          Decoration.mark({
            class: linkClass,
            attributes: {
              "data-target": dest,
              title: resolution.resolved
                ? `Open note: ${dest}`
                : `Create note: ${dest} (unresolved)`,
            },
          }).range(openBracketEnd, textEnd),
        );
      }
    }

    // 3. Parse Autolinks <https://...>
    for (const match of chunkText.matchAll(AUTOLINK_REGEX)) {
      const start = lineStart + match.index!;
      const end = start + match[0].length;
      if (occupiedRanges.some((r) => start >= r.from && end <= r.to)) {
        continue;
      }
      const url = match[1] ?? "";

      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-marker-hidden cm-link-mark",
        }).range(start, start + 1),
      );
      builder.push(
        Decoration.mark({
          class: "cm-markdown-syntax cm-marker-hidden cm-link-mark",
        }).range(end - 1, end),
      );
      builder.push(
        Decoration.mark({
          class: "cm-link cm-link-external",
          attributes: {
            "data-url": url,
            title: `Open external link: ${url}`,
          },
        }).range(start + 1, end - 1),
      );
    }
  }

  builder.sort((a, b) => a.from - b.from);
  return Decoration.set(builder);
}
