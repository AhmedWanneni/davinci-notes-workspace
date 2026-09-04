import type { AIProvider } from "@app/ai-api";
import { SqliteEmbeddingStore, type SqliteLike, type StoredEmbedding } from "@app/ai-embeddings";

export interface AskYourVaultOptions { retrievalLimit?: number; isConsented: () => Promise<boolean>; }
export interface AskCitation { chunkId: string; notePath: string; heading: string | null; startLine: number; endLine: number; }
export interface AskYourVaultResult { answer: string; citations: AskCitation[]; retrieved: StoredEmbedding[]; }

const DEFAULT_RETRIEVAL_LIMIT = 8;

export async function askYourVault(
  question: string,
  provider: AIProvider,
  db: SqliteLike,
  options: AskYourVaultOptions,
): Promise<AskYourVaultResult> {
  if (!question.trim()) throw new Error("ask-your-vault requires a question");
  if (!(await options.isConsented())) throw new Error("ask-your-vault consent is required");
  const query = await provider.embed({ inputs: [question] });
  const candidates = await new SqliteEmbeddingStore(db).querySimilar(
    query.vectors[0], options.retrievalLimit ?? DEFAULT_RETRIEVAL_LIMIT,
  );
  const retrieved = candidates.filter((row) => row.chunk.text.trim().length > 0);
  if (retrieved.length === 0) throw new Error("ask-your-vault has no text-bearing indexed chunks");
  const context = retrieved.map((row, index) => `[${index + 1}] ${row.chunk.text}`).join("\n\n");
  const response = await provider.complete({ messages: [{
    role: "user",
    content: `Use only the retrieved excerpts below to answer the question.\n\nRetrieved excerpts:\n${context}\n\nQuestion:\n${question}`,
  }] });
  return {
    answer: response.content,
    retrieved,
    citations: retrieved.map(({ chunk }) => ({ chunkId: chunk.id, notePath: chunk.notePath, heading: chunk.heading, startLine: chunk.startLine, endLine: chunk.endLine })),
  };
}
