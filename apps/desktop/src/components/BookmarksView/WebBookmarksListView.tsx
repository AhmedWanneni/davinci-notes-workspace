import React from "react";
import type {
  WebBookmarkItem,
  WebBookmarkViewConfig,
} from "../../bookmarks/bookmarkTypes";
import { WebBookmarkListRow } from "./WebBookmarkListRow";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarksListViewProps {
  items: readonly WebBookmarkItem[];
  viewConfig: WebBookmarkViewConfig;
  onOpenExternal: (url: string) => void;
  onEdit: (item: WebBookmarkItem) => void;
  onRemove: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function WebBookmarksListView({
  items,
  viewConfig,
  onOpenExternal,
  onEdit,
  onRemove,
  onRestore,
}: WebBookmarksListViewProps) {
  return (
    <div className={styles["wb-list-view"]} role="list">
      {items.map((item) => (
        <WebBookmarkListRow
          key={item.id}
          item={item}
          viewConfig={viewConfig}
          onOpenExternal={onOpenExternal}
          onEdit={onEdit}
          onRemove={onRemove}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
