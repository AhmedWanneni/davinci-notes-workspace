import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { EditorState, StateField } from "@codemirror/state";
import { sanitizeHtml } from "@app/sanitize";
import { youtubeEmbedVideoId, youtubeImageToIframe, youtubeThumbnailUrl } from "./youtubeEmbed";
import { tweetImageToStatusUrl } from "./tweetEmbed";
import { mountTweetCard } from "./tweetCard";

export interface HtmlBlock {
  from: number;
  to: number;
  source: string;
}

const TAG_PATTERN = /<!--[^]*?-->|<\/?([a-z][\w-]*)\b[^>]*?>/giu;
const activatedEmbeds = new Set<string>();

export function findHtmlBlocks(state: EditorState): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  const lines = state.doc.toString().split("\n");
  const starts: number[] = [];
  let offset = 0;
  lines.forEach((line) => { starts.push(offset); offset += line.length + 1; });
  for (let index = 0; index < lines.length; index += 1) {
    const openingName = /^<([a-z][\w-]*)\b/iu.exec(lines[index]!.trim())?.[1]?.toLowerCase();
    if (youtubeImageToIframe(lines[index]!.trim()) || tweetImageToStatusUrl(lines[index]!.trim())) {
      const from = starts[index]!;
      const to = from + lines[index]!.length;
      blocks.push({ from, to, source: lines[index]! });
      continue;
    }
    if (!openingName || !["table", "div", "iframe"].includes(openingName)) continue;
    const stack: string[] = [];
    let endLine = -1;
    for (let cursor = index; cursor < lines.length; cursor += 1) {
      if (!lines[cursor]!.trim()) break;
      for (const match of lines[cursor]!.matchAll(TAG_PATTERN)) {
        const raw = match[0];
        const name = match[1]?.toLowerCase();
        if (!name || raw.startsWith("<!--") || /\/\s*>$/u.test(raw)) continue;
        if (raw.startsWith("</")) {
          if (stack.at(-1) !== name) { stack.length = 0; break; }
          stack.pop();
          if (stack.length === 0) { endLine = cursor; break; }
        } else stack.push(name);
      }
      if (endLine >= 0 || stack.length === 0) break;
    }
    if (endLine < 0) continue;
    const from = starts[index]!;
    const to = starts[endLine]! + lines[endLine]!.length;
    blocks.push({ from, to, source: state.doc.sliceString(from, to) });
    index = endLine;
  }
  return blocks;
}

class HtmlBlockWidget extends WidgetType {
  constructor(readonly sanitizedHtml: string, readonly tweetUrl?: string) { super(); }
  eq(other: HtmlBlockWidget) { return this.sanitizedHtml === other.sanitizedHtml; }
  toDOM() {
    const element = document.createElement("div");
    element.className = "cm-html-block";
    if (this.tweetUrl) {
      const placeholder = document.createElement("button");
      placeholder.type = "button";
      placeholder.className = "cm-iframe-placeholder";
      placeholder.textContent = "Load tweet · x.com";
      placeholder.addEventListener("mousedown", (event) => { event.preventDefault(); event.stopPropagation(); });
      placeholder.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void mountTweetCard(element, this.tweetUrl!);
      }, { once: true });
      element.append(placeholder);
      return element;
    }
    element.innerHTML = this.sanitizedHtml;
    const iframe = element.querySelector<HTMLIFrameElement>("iframe");
    if (iframe) {
      const attributes = [...iframe.attributes].map(({ name, value }) => [name, value] as const);
      const hostname = new URL(iframe.src).hostname;
      const youtubeId = youtubeEmbedVideoId(iframe.src);
      if (activatedEmbeds.has(iframe.src)) {
        iframe.className = "cm-iframe-embed";
        return element;
      }
      if (youtubeId) {
        const facade = document.createElement("button");
        facade.type = "button";
        facade.className = "cm-youtube-facade";
        const thumbnail = document.createElement("img");
        thumbnail.src = youtubeThumbnailUrl(youtubeId);
        thumbnail.alt = "YouTube video thumbnail";
        thumbnail.addEventListener("error", () => {
          thumbnail.remove();
          const fallback = document.createElement("span");
          fallback.className = "cm-youtube-facade__fallback";
          fallback.textContent = "Video thumbnail unavailable";
          facade.prepend(fallback);
        }, { once: true });
        const play = document.createElement("span");
        play.className = "cm-youtube-facade__play";
        play.setAttribute("aria-hidden", "true");
        play.textContent = "▶";
        facade.append(thumbnail, play);
        let activated = false;
        const activate = (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          if (activated) return;
          activated = true;
          activatedEmbeds.add(iframe.src);
          const loaded = document.createElement("iframe");
          attributes.forEach(([name, value]) => loaded.setAttribute(name,
            name === "src" ? `${value}${value.includes("?") ? "&" : "?"}autoplay=1` : value));
          loaded.className = "cm-iframe-embed";
          facade.replaceWith(loaded);
        };
        facade.addEventListener("mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        });
        facade.addEventListener("click", activate, { once: true });
        iframe.replaceWith(facade);
        return element;
      }
      const placeholder = document.createElement("button");
      placeholder.type = "button";
      placeholder.className = "cm-iframe-placeholder";
      placeholder.textContent = `Load embed · ${hostname}`;
      placeholder.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        activatedEmbeds.add(iframe.src);
        const loaded = document.createElement("iframe");
        attributes.forEach(([name, value]) => loaded.setAttribute(name, value));
        loaded.className = "cm-iframe-embed";
        iframe.replaceWith(loaded);
      });
      placeholder.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        activatedEmbeds.add(iframe.src);
        const loaded = document.createElement("iframe");
        attributes.forEach(([name, value]) => loaded.setAttribute(name, value));
        loaded.className = "cm-iframe-embed";
        iframe.replaceWith(loaded);
      }, { once: true });
      iframe.replaceWith(placeholder);
    }
    return element;
  }
  ignoreEvent() { return true; }
}

export function htmlBlockExtension() {
  const decorations = StateField.define<DecorationSet>({
    create: (state) => buildHtmlBlockDecorations(state),
    update: (value, transaction) => transaction.docChanged || transaction.selection
      ? buildHtmlBlockDecorations(transaction.state)
      : value,
    provide: (field) => EditorView.decorations.from(field),
  });
  return decorations;
}

function buildHtmlBlockDecorations(state: EditorState): DecorationSet {
  const cursor = state.selection.main.head;
  const editable = state.facet(EditorView.editable);
  const ranges = findHtmlBlocks(state)
    .filter((block) => !editable || cursor <= block.from || cursor >= block.to)
    .map((block) => Decoration.replace({
    widget: new HtmlBlockWidget(
      sanitizeHtml(youtubeImageToIframe(block.source) ?? block.source.trim()),
      tweetImageToStatusUrl(block.source) ?? undefined,
    ),
      block: true,
      inclusive: true,
    }).range(block.from, block.to));
  return Decoration.set(ranges, true);
}
