import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/**
 * HTML → Obsidian-flavoured Markdown.
 *
 * Defuddle's *core* bundle does not include its Markdown converter (that lives in
 * `defuddle/full`, which also drags in temml). Measured on this codebase:
 * `defuddle/full` is 213.4 KB gzip against 99.5 KB gzip for core + Turndown, and
 * the core bundle still annotates the HTML with `data-latex` and `data-callout`,
 * so the rules below recover LaTeX math and Obsidian callouts at half the weight.
 *
 * The service is built lazily: a popup that only previews should not pay for it.
 */

const CALLOUT_CLASS = "callout";
const CALLOUT_FOLD_CLASS = "callout-fold";

/**
 * `turndown-plugin-gfm` writes list markers with three spaces (`-   item`). Valid
 * CommonMark, but it is our note format, so markers are tidied to one space —
 * indentation on nested lines is preserved because it is part of the match.
 */
const LIST_MARKER_SPACING = /^(\s*(?:[-*+]|\d+\.)) {2,}/gm;

let service: TurndownService | undefined;

function calloutRules(turndown: TurndownService): void {
  turndown.addRule("callout", {
    filter: (node) =>
      node.nodeName === "DIV" &&
      node.classList.contains(CALLOUT_CLASS) &&
      node.hasAttribute("data-callout"),
    replacement: (content, node) => {
      const type = node.getAttribute("data-callout") ?? "note";
      const fold = node.getAttribute("data-callout-fold");
      const title =
        node.querySelector(".callout-title-inner")?.textContent?.trim() ??
        node.querySelector(".callout-title")?.textContent?.trim() ??
        "";

      const marker = fold === "+" || fold === "-" ? fold : "";
      const label = title.length > 0 ? `${marker} ${title}` : marker;
      const head = `> [!${type}]${label}`.replace(/\s+$/, "");
      const body = content
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0)
        .map((line) => `> ${line}`)
        .join("\n");

      return `\n\n${head}${body.length > 0 ? `\n${body}` : ""}\n\n`;
    },
  });

  // The title and the fold affordance are rendered from the callout's own
  // attributes above, so they must not also appear as converted body content.
  turndown.addRule("callout-title", {
    filter: (node) => node.classList.contains("callout-title"),
    replacement: () => "",
  });

  turndown.addRule("callout-fold", {
    filter: (node) =>
      node.nodeName === "DIV" && node.classList.contains(CALLOUT_FOLD_CLASS),
    replacement: () => "",
  });
}

function mathRule(turndown: TurndownService): void {
  turndown.addRule("math", {
    filter: (node) =>
      node.hasAttribute("data-latex") || node.nodeName === "MATH",
    replacement: (_content, node) => {
      const latex = (
        node.getAttribute("data-latex") ??
        node.textContent ??
        ""
      ).trim();
      if (latex.length === 0) return "";
      const block =
        node.getAttribute("display") === "block" || node.nodeName === "DIV";
      return block ? `\n\n$$\n${latex}\n$$\n\n` : `$${latex}$`;
    },
  });
}

function createService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });
  turndown.use(gfm);
  turndown.remove(["script", "style"]);
  mathRule(turndown);
  calloutRules(turndown);
  return turndown;
}

/**
 * Turndown drops any element whose text content is empty before it consults
 * custom rules, which would silently lose `<math data-latex="…"></math>`. Seeding
 * the text content makes it non-empty; the `math` rule reads the attribute either
 * way. Skipped entirely when the segment has no math.
 */
function seedBlankMath(html: string): string {
  if (!html.includes("data-latex")) return html;
  const container = document.createElement("div");
  container.innerHTML = html;
  for (const element of Array.from(
    container.querySelectorAll("math, [data-latex]"),
  )) {
    if ((element.textContent ?? "").trim().length === 0) {
      element.textContent = element.getAttribute("data-latex") ?? " ";
    }
  }
  return container.innerHTML;
}

export function htmlToMarkdown(html: string): string {
  if (html.trim().length === 0) return "";
  service ??= createService();
  return service
    .turndown(seedBlankMath(html))
    .replace(LIST_MARKER_SPACING, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
