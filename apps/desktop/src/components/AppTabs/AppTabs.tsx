import React from "react";

export interface AppTabsProps {
  openNotes: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  onSelectNote: (path: string) => void;
  onCloseNote: (path: string) => void;
}

export function AppTabs({
  openNotes,
  activeNotePath,
  dirtyNotes,
  onSelectNote,
  onCloseNote,
}: AppTabsProps) {
  return (
    <div className="app-tabs">
      {openNotes.map((path) => {
        const displayTitle =
          path.replace(/\.md$/i, "").split("/").pop() ?? path;
        const isActive = activeNotePath === path;
        const isDirty = dirtyNotes.has(path);
        return (
          <div
            key={path}
            className="app-tabs__tab"
            data-active={isActive || undefined}
            onClick={() => onSelectNote(path)}
          >
            <span>{displayTitle}</span>
            {isDirty && <span className="app-tabs__dirty-dot" />}
            <span
              className="app-tabs__close"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onCloseNote(path);
              }}
            >
              ✕
            </span>
          </div>
        );
      })}
    </div>
  );
}
