import { useMemo, useState } from "react";
import {
  CaretDown,
  CaretRight,
  FolderSimple,
  Sparkle,
} from "@phosphor-icons/react";
import type { WebBookmarkItem } from "../../bookmarks/bookmarkTypes";
import { WebBookmarkRow } from "./WebBookmarkRow";
import styles from "./BookmarksView.module.scss";
import webStyles from "./WebBookmarks.module.scss";
import catStyles from "./WebBookmarksCategoryView.module.scss";

export interface WebBookmarksCategoryViewProps {
  items: readonly WebBookmarkItem[];
  isOrganizingAI?: boolean;
  onOpenExternal: (url: string) => void;
  onSelectFolder: (folder: string) => void;
  onSelectTag: (tag: string) => void;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<WebBookmarkItem, "title" | "url" | "folder" | "tags" | "description">
    >,
  ) => void;
  onRemove: (id: string) => void;
  onOrganizeUncategorized?: (items: readonly WebBookmarkItem[]) => void;
}

export function WebBookmarksCategoryView({
  items,
  isOrganizingAI = false,
  onOpenExternal,
  onSelectFolder,
  onSelectTag,
  onUpdate,
  onRemove,
  onOrganizeUncategorized,
}: WebBookmarksCategoryViewProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

  const groupedCategories = useMemo(() => {
    const map = new Map<string, WebBookmarkItem[]>();
    const uncategorized: WebBookmarkItem[] = [];

    for (const item of items) {
      const cat = item.folder?.trim();
      if (cat) {
        const list = map.get(cat) ?? [];
        list.push(item);
        map.set(cat, list);
      } else {
        uncategorized.push(item);
      }
    }

    const sortedNamed = Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    if (uncategorized.length > 0) {
      sortedNamed.push(["Uncategorized", uncategorized]);
    }
    return sortedNamed;
  }, [items]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div
      className={catStyles["category-sections"]}
      data-testid="web-bookmarks-category-view"
    >
      {groupedCategories.map(([category, groupItems]) => {
        const isCollapsed = Boolean(collapsedCategories[category]);
        const isUncategorized = category === "Uncategorized";

        return (
          <section
            key={category}
            className={catStyles["category-section"]}
            aria-label={`Category ${category}`}
          >
            <div className={catStyles["category-header"]}>
              <button
                type="button"
                className={catStyles["category-title-btn"]}
                onClick={() => toggleCategory(category)}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <CaretRight size={14} />
                ) : (
                  <CaretDown size={14} />
                )}
                <FolderSimple size={15} />
                <span>{category}</span>
                <span className={styles["bookmarks-view__badge"]}>
                  {groupItems.length}
                </span>
              </button>

              {isUncategorized && onOrganizeUncategorized && (
                <button
                  type="button"
                  className={`${webStyles["action-btn"]} ${webStyles["is-primary"]}`}
                  disabled={isOrganizingAI}
                  onClick={() => onOrganizeUncategorized(groupItems)}
                >
                  <Sparkle size={13} />
                  {isOrganizingAI
                    ? "Organizing..."
                    : "Organize into Categories"}
                </button>
              )}
            </div>

            {!isCollapsed && (
              <ul className={styles["bookmarks-view__list"]} role="listbox">
                {groupItems.map((item) => (
                  <WebBookmarkRow
                    key={item.id}
                    item={item}
                    isSelected={false}
                    onOpenExternal={onOpenExternal}
                    onSelectFolder={onSelectFolder}
                    onSelectTag={onSelectTag}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
