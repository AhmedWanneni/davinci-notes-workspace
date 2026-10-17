import {
  parseSearchQuery,
  executeSearchQuery,
  type TagIndex,
  type SearchResult,
} from "@app/indexer";
import {
  getVaultIndexDb,
  withDbLock,
  createMobileSearchDatabase,
} from "../database";

export interface MobileSearchResult extends SearchResult {
  matchCount?: number;
}

export async function searchVault(
  rawQuery: string,
  tagIndex: TagIndex,
): Promise<MobileSearchResult[]> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const parsed = parseSearchQuery(trimmed);
  if (parsed.clauses.length === 0 || parsed.errors.length > 0) {
    return [];
  }

  const db = await getVaultIndexDb();
  const searchDb = createMobileSearchDatabase(db);

  // Standing rule: All database operations execute through withDbLock
  return withDbLock(async () => {
    const results = await executeSearchQuery(searchDb, tagIndex, parsed);
    return results.map((r) => ({
      ...r,
      matchCount: r.score !== undefined ? 1 : undefined,
    }));
  });
}
