import type { TranscriptSegmentItem } from "./listeningTypes";
import { getVaultIndexDb, withDbLock } from "../../vault";

export interface TranscriptSearchResult {
  segmentId: string;
  speaker: string;
  text: string;
  timestampMs: number;
  matchScore: number;
  snippet?: string;
}

/**
 * Searches raw transcript segments for exact keywords or phrases using SQLite FTS5
 * when database is available, with in-memory BM25 fallback.
 */
export async function searchMeetingTranscript(
  segments: TranscriptSegmentItem[],
  query: string,
): Promise<TranscriptSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || segments.length === 0) return [];

  const queryTerms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return [];

  try {
    const db = await getVaultIndexDb().catch(() => null);
    if (db) {
      return await withDbLock(async () => {
        // Create an in-memory / temp FTS5 table for the current transcript
        await db.execute(
          "CREATE VIRTUAL TABLE IF NOT EXISTS temp.transcript_fts USING fts5(id UNINDEXED, speaker, text, timestamp_ms UNINDEXED);",
        );
        await db.execute("DELETE FROM temp.transcript_fts;");

        for (const seg of segments) {
          await db.execute(
            "INSERT INTO temp.transcript_fts (id, speaker, text, timestamp_ms) VALUES ($1, $2, $3, $4);",
            [seg.id, seg.speaker, seg.text, seg.timestampMs],
          );
        }

        // Clean query terms for FTS5 (alphanumeric only to avoid syntax errors)
        const ftsQuery = queryTerms
          .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
          .filter(Boolean)
          .join(" OR ");

        if (!ftsQuery) return fallbackSearch(segments, queryTerms);

        const rows = await db.select<
          Array<{
            id: string;
            speaker: string;
            text: string;
            timestamp_ms: number;
            rank: number;
            snippet: string;
          }>
        >(
          `SELECT id, speaker, text, timestamp_ms, bm25(transcript_fts) AS rank,
                  snippet(transcript_fts, 2, '<mark>', '</mark>', '…', 16) AS snippet
             FROM temp.transcript_fts
            WHERE transcript_fts MATCH $1
            ORDER BY rank ASC
            LIMIT 10;`,
          [ftsQuery],
        );

        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            segmentId: r.id,
            speaker: r.speaker,
            text: r.text,
            timestampMs: Number(r.timestamp_ms) || 0,
            matchScore: Math.abs(r.rank),
            snippet: r.snippet,
          }));
        }

        return fallbackSearch(segments, queryTerms);
      });
    }
  } catch {
    // Fall back gracefully if SQLite or FTS5 encounters any error
  }

  return fallbackSearch(segments, queryTerms);
}

function fallbackSearch(
  segments: TranscriptSegmentItem[],
  queryTerms: string[],
): TranscriptSearchResult[] {
  const scored: Array<TranscriptSearchResult & { score: number }> = [];

  for (const seg of segments) {
    const lower = seg.text.toLowerCase();
    let termHits = 0;

    for (const term of queryTerms) {
      if (lower.includes(term)) {
        termHits++;
      }
    }

    if (termHits > 0) {
      scored.push({
        segmentId: seg.id,
        speaker: seg.speaker,
        text: seg.text,
        timestampMs: seg.timestampMs,
        matchScore: termHits / queryTerms.length,
        score: termHits,
        snippet: seg.text,
      });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score: _, ...rest }) => rest);
}
