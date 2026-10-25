import type { AgentToolDefinition } from "@app/ai-api";
import { encapsulateWebContent } from "./untrustedContentGuard.js";

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchBackend {
  search(query: string, limit?: number): Promise<WebSearchResultItem[]>;
}

export const WEB_SEARCH_TOOL: AgentToolDefinition = {
  name: "web_search",
  description: "Search the public web for real-time information, documentation, and external facts",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "integer", description: "Number of results to return (default: 5, max: 10)" },
    },
    required: ["query"],
  },
};

/**
 * Clean raw HTML into inert plain text, stripping scripts, styles, and tags.
 */
export function cleanHtmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse DuckDuckGo HTML results (zero-key fallback).
 */
export function parseDuckDuckGoHtml(html: string): WebSearchResultItem[] {
  const results: WebSearchResultItem[] = [];
  const regex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null && results.length < 10) {
    const rawUrl = match[1];
    const snippetHtml = match[2];
    const snippet = cleanHtmlToText(snippetHtml);

    // Unescape DuckDuckGo redirect uddg parameter
    const uddgMatch = /[?&]uddg=([^&]+)/.exec(rawUrl);
    const url = uddgMatch ? decodeURIComponent(uddgMatch[1]) : rawUrl;

    if (url && snippet) {
      results.push({
        title: url,
        url,
        snippet,
      });
    }
  }

  return results;
}

export async function executeWebSearchTool(
  args: Record<string, unknown>,
  backend: WebSearchBackend,
): Promise<{ query: string; results: Array<{ title: string; url: string; content: string }> }> {
  const query = String(args.query ?? "").trim();
  if (!query) throw new Error("web_search requires a non-empty query");
  const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 10);

  const rawResults = await backend.search(query, limit);

  return {
    query,
    results: rawResults.slice(0, limit).map((r) => ({
      title: r.title,
      url: r.url,
      content: encapsulateWebContent(`${r.title}\n\n${r.snippet}`, {
        sourceUrl: r.url,
      }),
    })),
  };
}
