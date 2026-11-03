import type {
  WebBookmarkItem,
  WebBookmarkViewConfig,
} from "../../bookmarks/bookmarkTypes";
import { WebBookmarksListView } from "./WebBookmarksListView";
import { WebBookmarksCardsView } from "./WebBookmarksCardsView";
import { WebBookmarksMoodboardView } from "./WebBookmarksMoodboardView";
import { WebBookmarksHeadlinesView } from "./WebBookmarksHeadlinesView";

export interface WebBookmarksViewSwitchProps {
  items: readonly WebBookmarkItem[];
  viewConfig: WebBookmarkViewConfig;
  onOpenExternal: (url: string) => void;
  onEdit: (item: WebBookmarkItem) => void;
  onRemove: (id: string) => void;
  onRestore?: (id: string) => void;
  isNotes?: boolean;
  showCheckboxes?: boolean;
}

/** Renders the bookmark collection in the selected display mode. */
export function WebBookmarksViewSwitch({
  items,
  viewConfig,
  onOpenExternal,
  onEdit,
  onRemove,
  onRestore,
  isNotes = false,
  showCheckboxes = false,
}: WebBookmarksViewSwitchProps) {
  if (viewConfig.mode === "cards") {
    return (
      <WebBookmarksCardsView
        items={items}
        viewConfig={viewConfig}
        onOpenExternal={onOpenExternal}
        onEdit={onEdit}
        onRemove={onRemove}
        onRestore={onRestore}
        isNotes={isNotes}
      />
    );
  }
  if (viewConfig.mode === "moodboard") {
    return (
      <WebBookmarksMoodboardView
        items={items}
        viewConfig={viewConfig}
        onOpenExternal={onOpenExternal}
        onEdit={onEdit}
        onRemove={onRemove}
        onRestore={onRestore}
        isNotes={isNotes}
      />
    );
  }
  if (viewConfig.mode === "headlines") {
    return (
      <WebBookmarksHeadlinesView
        items={items}
        viewConfig={viewConfig}
        onOpenExternal={onOpenExternal}
        onEdit={onEdit}
        onRemove={onRemove}
        isNotes={isNotes}
      />
    );
  }
  return (
    <WebBookmarksListView
      items={items}
      viewConfig={viewConfig}
      onOpenExternal={onOpenExternal}
      onEdit={onEdit}
      onRemove={onRemove}
      onRestore={onRestore}
      isNotes={isNotes}
      showCheckboxes={showCheckboxes}
    />
  );
}
