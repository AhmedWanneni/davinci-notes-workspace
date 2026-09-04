import type { AIProvider } from "@app/ai-api";
import { SqliteEmbeddingStore, type SqliteLike } from "./EmbeddingStore";

export interface SemanticSearchResult {
  path: string;
  heading: string | null;
  startLine: number;
  endLine: number;
  score: number;
}

export async function searchEmbeddings(
  query: string,
  provider: AIProvider,
  db: SqliteLike,
  limit = 20,
): Promise<SemanticSearchResult[]> {
  const response = await provider.embed({ inputs: [query] });
  const rows = await new SqliteEmbeddingStore(db).querySimilar(response.vectors[0], limit);
  return rows.map((row) => ({
    path: row.chunk.notePath,
    heading: row.chunk.heading,
    startLine: row.chunk.startLine,
    endLine: row.chunk.endLine,
    score: row.similarity ?? 0,
  }));
}
