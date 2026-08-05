import { parse } from "yaml";
import type { Frontmatter } from "@app/core-types";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export interface ParseFrontmatterResult {
  frontmatter: Frontmatter;
  /** Note body with the frontmatter block removed. */
  content: string;
  /** Present when YAML parsing failed — partial data may still be returned. */
  error?: string;
}

/** Extract YAML frontmatter from raw note text. */
export function parseFrontmatter(raw: string): ParseFrontmatterResult {
  const match = raw.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { frontmatter: {}, content: raw };
  }

  const yamlBlock = match[1] ?? "";
  const content = raw.slice(match[0].length);

  try {
    const parsed = parse(yamlBlock);
    if (parsed === null || parsed === undefined) {
      return { frontmatter: {}, content };
    }
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        frontmatter: {},
        content,
        error: "Frontmatter root must be a YAML mapping",
      };
    }
    return { frontmatter: parsed as Frontmatter, content };
  } catch (err) {
    return {
      frontmatter: {},
      content,
      error: err instanceof Error ? err.message : "Invalid frontmatter YAML",
    };
  }
}
