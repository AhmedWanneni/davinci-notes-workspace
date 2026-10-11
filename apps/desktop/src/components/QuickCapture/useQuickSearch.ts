import { useEffect, useRef, useState } from "react";
import {
  createEmptyTagIndex,
  executeSearchQuery,
  parseSearchQuery,
  type SearchResult,
} from "@app/indexer";
import { getVaultIndexDb, withDbLock } from "../../vault/sqliteIndex";

export const MAX_SEARCH_RESULTS = 8;
export const SEARCH_DEBOUNCE_MS = 150;

export interface UseQuickSearchOptions {
  debounceMs?: number;
  searchFn?: (query: string) => Promise<SearchResult[]>;
}

export function useQuickSearch(options: UseQuickSearchOptions = {}) {
  const { debounceMs = SEARCH_DEBOUNCE_MS, searchFn } = options;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const querySeqRef = useRef(0);
  const tagIndexRef = useRef(createEmptyTagIndex());
  const searchFnRef = useRef(searchFn);
  searchFnRef.current = searchFn;

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setIsError(false);
      setSelectedIndex(0);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    const seq = ++querySeqRef.current;

    const timer = window.setTimeout(() => {
      const performQuery = async (): Promise<SearchResult[]> => {
        if (searchFnRef.current) {
          return searchFnRef.current(trimmed);
        }
        const db = await getVaultIndexDb();
        return withDbLock(() =>
          executeSearchQuery(
            db,
            tagIndexRef.current,
            parseSearchQuery(trimmed),
          ),
        );
      };

      performQuery()
        .then((allResults) => {
          if (seq !== querySeqRef.current) return;
          setResults(allResults.slice(0, MAX_SEARCH_RESULTS));
          setSelectedIndex(0);
          setIsLoading(false);
          setIsError(false);
        })
        .catch((err) => {
          if (seq !== querySeqRef.current) return;
          console.error("Quick search query failed:", err);
          setResults([]);
          setIsLoading(false);
          setIsError(true);
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [debounceMs, query]);

  const resetSearch = () => {
    querySeqRef.current += 1;
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setIsError(false);
    setSelectedIndex(0);
  };

  const selectNext = () => {
    if (results.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % results.length);
  };

  const selectPrevious = () => {
    if (results.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    isError,
    selectedIndex,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    resetSearch,
  };
}
