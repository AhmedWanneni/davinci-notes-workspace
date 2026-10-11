import type { SearchResult } from "@app/indexer";
import styles from "./QuickCapture.module.scss";

export function formatNoteTitle(path: string, title?: string): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  const fileName = path.split("/").pop() ?? path;
  return fileName.replace(/\.md$/, "");
}

export function getNoteFolder(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) {
    return "/";
  }
  return path.slice(0, lastSlash);
}

export interface QuickSearchListProps {
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;
  isError: boolean;
  query: string;
  onSelect: (path: string) => void;
  onHoverIndex: (index: number) => void;
}

export function QuickSearchList({
  results,
  selectedIndex,
  isLoading,
  isError,
  query,
  onSelect,
  onHoverIndex,
}: QuickSearchListProps) {
  const trimmedQuery = query.trim();

  if (isError) {
    return (
      <div className={styles["quick-search-status"]} role="status">
        Search index unavailable
      </div>
    );
  }

  if (isLoading && results.length === 0) {
    return (
      <div className={styles["quick-search-status"]} role="status">
        Searching...
      </div>
    );
  }

  if (!trimmedQuery) {
    return (
      <div className={styles["quick-search-status"]} role="status">
        Type to search notes...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles["quick-search-status"]} role="status">
        No matching notes found
      </div>
    );
  }

  return (
    <ul
      className={styles["quick-search-list"]}
      role="listbox"
      aria-label="Search results"
    >
      {results.map((item, index) => {
        const isSelected = index === selectedIndex;
        const displayTitle = formatNoteTitle(item.path, item.title);
        const folder = getNoteFolder(item.path);

        return (
          <li
            key={item.path}
            role="option"
            aria-selected={isSelected}
            className={`${styles["quick-search-item"]} ${
              isSelected ? styles["quick-search-item-selected"] : ""
            }`}
            onClick={() => onSelect(item.path)}
            onMouseEnter={() => onHoverIndex(index)}
          >
            <span className={styles["quick-search-item-title"]}>
              {displayTitle}
            </span>
            <span className={styles["quick-search-item-folder"]}>{folder}</span>
          </li>
        );
      })}
    </ul>
  );
}
