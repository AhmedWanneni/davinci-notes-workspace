import React from "react";
import {
  Plus,
  SidebarSimple,
  SlidersHorizontal,
  FileText,
  FrameCorners,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";

export interface AppTabsProps {
  openNotes: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  onSelectNote: (path: string) => void;
  onCloseNote: (path: string) => void;
  onNewTab?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

export function AppTabs({
  openNotes,
  activeNotePath,
  dirtyNotes,
  onSelectNote,
  onCloseNote,
  onNewTab,
  isRightSidebarOpen,
  onToggleRightSidebar,
}: AppTabsProps) {
  return (
    <div className="app-tabs" role="tablist" aria-label="Open notes">
      <div className="app-tabs__strip">
        {openNotes.map((path) => {
          const isCanvas = path.endsWith(".canvas");
          const displayTitle =
            path
              .replace(/\.(md|canvas)$/i, "")
              .split("/")
              .pop() ?? path;
          const isActive = activeNotePath === path;
          const isDirty = dirtyNotes.has(path);
          return (
            <div
              key={path}
              className="app-tabs__tab"
              role="tab"
              aria-selected={isActive}
              data-active={isActive || undefined}
              onClick={() => onSelectNote(path)}
              title={path}
            >
              <span className="app-tabs__tab-icon" aria-hidden="true">
                {isCanvas ? (
                  <FrameCorners size={13} weight="regular" />
                ) : (
                  <FileText size={13} weight="regular" />
                )}
              </span>
              <span className="app-tabs__tab-title">{displayTitle}</span>
              {isDirty && <span className="app-tabs__dirty-dot" />}
              <button
                type="button"
                className="app-tabs__close"
                aria-label={`Close ${displayTitle}`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onCloseNote(path);
                }}
              >
                ✕
              </button>
            </div>
          );
        })}

        {onNewTab && (
          <Tooltip content="New tab" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className="app-tabs__new-btn"
              onClick={onNewTab}
              aria-label="New tab"
            >
              <Plus size={14} />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="app-tabs__actions">
        <Tooltip content="View options" contentProps={{ side: "bottom" }}>
          <button
            type="button"
            className="app-tabs__action-btn"
            aria-label="View options"
          >
            <SlidersHorizontal size={14} />
          </button>
        </Tooltip>

        {onToggleRightSidebar && (
          <Tooltip
            content="Toggle right sidebar"
            contentProps={{ side: "bottom" }}
          >
            <button
              type="button"
              className="app-tabs__action-btn"
              data-active={isRightSidebarOpen || undefined}
              onClick={onToggleRightSidebar}
              aria-label="Toggle right sidebar"
            >
              <SidebarSimple size={15} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
