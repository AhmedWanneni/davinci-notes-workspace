export interface FormatMarkdownOptions {
  tabSize?: number;
  insertFinalNewline?: boolean;
}

export interface FormatMarkdownResult {
  formatted: string;
  changed: boolean;
}

export interface ProtectedSpan {
  id: string;
  raw: string;
  type:
    | "frontmatter"
    | "code-block"
    | "inline-code"
    | "wikilink"
    | "embed"
    | "tag"
    | "comment"
    | "callout-header"
    | "h1-title";
}
