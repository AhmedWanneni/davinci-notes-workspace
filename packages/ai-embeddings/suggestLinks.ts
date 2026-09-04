import type { AIProvider } from "@app/ai-api";
import { SqliteEmbeddingStore, type SqliteLike } from "./EmbeddingStore";

export interface LinkSuggestion {
  path: string;
  heading: string | null;
  startLine: number;
  endLine: number;
  score: number;
}

export async function suggestLinks(
  notePath: string,
  content: string,
  provider: AIProvider,
  db: SqliteLike,
  limit = 5,
  threshold = 0.78,
): Promise<LinkSuggestion[]> {
  const response = await provider.embed({ inputs: [content] });
  const rows = await new SqliteEmbeddingStore(db).querySimilar(response.vectors[0], limit + 1);
  return rows
    .filter((row) => row.chunk.notePath !== notePath && (row.similarity ?? 0) >= threshold)
    .slice(0, limit)
    .map((row) => ({ path: row.chunk.notePath, heading: row.chunk.heading,
      startLine: row.chunk.startLine, endLine: row.chunk.endLine, score: row.similarity ?? 0 }));
}
