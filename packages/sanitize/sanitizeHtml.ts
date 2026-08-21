import createDOMPurify from "dompurify";
import type { WindowLike } from "dompurify";
import { applyIframePolicy } from "./iframePolicy";

const ALLOWED_TAGS = ["u", "s", "span", "div", "table", "tr", "td", "iframe"];
const ALLOWED_ATTR = ["class", "style", "src", "sandbox", "allow", "referrerpolicy"];
const STYLE_PROPERTIES = new Set([
  "color",
  "background-color",
  "font-weight",
  "text-decoration",
  "text-align",
]);
const COLOR = "(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\\([^)]*\\)|[a-z]+)";

function isSafeStyleValue(property: string, value: string): boolean {
  if (/url\s*\(|expression\s*\(|javascript:|data:/i.test(value)) return false;
  if (property === "color" || property === "background-color") {
    return new RegExp(`^${COLOR}$`, "i").test(value);
  }
  if (property === "font-weight") return /^(normal|bold|[1-9]00)$/i.test(value);
  if (property === "text-decoration") return /^(none|underline|line-through)$/i.test(value);
  return /^(left|right|center)$/i.test(value);
}

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .flatMap((declaration) => {
      const separator = declaration.indexOf(":");
      if (separator < 1) return [];
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      if (!STYLE_PROPERTIES.has(property) || !isSafeStyleValue(property, value)) return [];
      return [`${property}: ${value}`];
    })
    .join("; ");
}

function sanitizeClass(value: string): string {
  return value
    .split(/\s+/)
    .filter((name) => /^[a-z0-9_-]+$/i.test(name))
    .join(" ");
}

export function sanitizeHtml(html: string): string {
  const window = globalThis.window as WindowLike | undefined;
  if (!window) throw new Error("sanitizeHtml requires a DOM window");
  const comments: string[] = [];
  const iframeHtml = applyIframePolicy(html).html;
  const commentSafeHtml = iframeHtml.replace(/<!--[\s\S]*?-->/g, (comment) => {
    const body = comment.slice(4, -3).replace(/--+/g, "-");
    comments.push(`<!--${body}-->`);
    return `__SANITIZED_COMMENT_${comments.length - 1}__`;
  });
  const purifier = createDOMPurify(window);
  purifier.addHook("uponSanitizeAttribute", (_node, data) => {
    if (/^on/i.test(data.attrName)) data.keepAttr = false;
    if (data.attrName === "style") data.attrValue = sanitizeStyle(data.attrValue);
    if (data.attrName === "class") data.attrValue = sanitizeClass(data.attrValue);
  });
  let sanitized = purifier.sanitize(commentSafeHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
    FORBID_TAGS: ["script", "style"],
  }) as string;
  comments.forEach((comment, index) => {
    sanitized = sanitized.replace(`__SANITIZED_COMMENT_${index}__`, comment);
  });
  return sanitized;
}
