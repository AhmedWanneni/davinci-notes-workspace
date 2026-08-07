import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CaretRight, CaretDown, FileText } from "@phosphor-icons/react";
import { buildTreeFromPaths, flattenVisibleTree } from "./tree-utils";
import styles from "./FileTree.module.scss";

interface FileTreeProps {
  paths: string[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  onNoteClick: (path: string) => void;
}

export function FileTree({
  paths,
  activePath,
  dirtyPaths,
  onNoteClick,
}: FileTreeProps) {
  // Memoize the full nested tree
  const tree = useMemo(() => buildTreeFromPaths(paths), [paths]);

  // Keep track of expanded folders. Default to root level folders?
  // Or just empty initially. Let's say we start with an empty set (all collapsed).
  // But wait, if activePath is nested, we might want to expand to it.
  // For now, let's just initialize it empty, but automatically expand parents of active note.
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(),
  );

  // Auto-expand folders when activePath changes
  useEffect(() => {
    if (activePath) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        let changed = false;
        const parts = activePath.split("/");
        let currentPath = "";
        // iterate all parts except the last one (which is the file)
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += (currentPath ? "/" : "") + parts[i];
          if (!next.has(currentPath)) {
            next.add(currentPath);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [activePath]);

  const toggleFolder = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  // Flatten the tree into an array of visible nodes
  const visibleNodes = useMemo(() => {
    return flattenVisibleTree(tree, expandedFolders);
  }, [tree, expandedFolders]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28, // 28px row height
    overscan: 10,
  });

  return (
    <div className={styles.container} ref={parentRef}>
      <div
        className={"virtual-inner"}
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = visibleNodes[virtualItem.index];
          const isFile = item.node.type === "file";
          const isActive = isFile && item.node.path === activePath;
          const isDirty = isFile && dirtyPaths.has(item.node.path);
          const isExpanded = !isFile && expandedFolders.has(item.node.path);
          const displayTitle = item.node.name.replace(/\.md$/i, "");

          return (
            <div
              key={virtualItem.key}
              className={`${styles.row} ${isActive ? styles.active : ""}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                paddingLeft: `calc(var(--space-2) + ${item.depth * 16}px)`,
              }}
              onClick={(e) => {
                if (isFile) {
                  onNoteClick(item.node.path);
                } else {
                  toggleFolder(item.node.path, e);
                }
              }}
            >
              <span className={"icon-wrapper"}>
                {!isFile ? (
                  isExpanded ? (
                    <CaretDown size={14} weight="bold" className={"caret"} />
                  ) : (
                    <CaretRight size={14} weight="bold" className={"caret"} />
                  )
                ) : (
                  <FileText size={14} className={"file-icon"} />
                )}
              </span>
              <span className={"title"} title={item.node.name}>
                {displayTitle}
              </span>
              {isDirty && <span className={"dirty-dot"} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
