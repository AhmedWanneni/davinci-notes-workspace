import React from "react";
import {
  Plus,
  SidebarSimple,
  FileText,
  FrameCorners,
  X,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";
import { WindowControls } from "../WindowControls";
import { TabListDropdown } from "./TabListDropdown";

export interface AppTabsProps {
  openNotes: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  conflictNotes?: Map<string, string>;
  onSelectNote: (path: string) => void;
  onCloseNote: (path: string) => void;
  onCloseAllNotes?: () => void;
  onCreateNote?: () => void;
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  isMac: boolean;
  showWindowControls?: boolean;
}

export function AppTabs({
  openNotes,
  activeNotePath,
  dirtyNotes,
  conflictNotes,
  onSelectNote,
  onCloseNote,
  onCloseAllNotes,
  onCreateNote,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  isMac,
  showWindowControls,
}: AppTabsProps) {
  const tabStripRef = React.useRef<HTMLDivElement>(null);

  const scrollTabIntoView = React.useCallback((path: string) => {
    const tabEl = tabStripRef.current?.querySelector<HTMLElement>(
      `[data-tab-path="${CSS.escape(path)}"]`,
    );
    tabEl?.scrollIntoView?.({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, []);

  const handleSelectNote = React.useCallback(
    (path: string) => {
      onSelectNote(path);
      scrollTabIntoView(path);
    },
    [onSelectNote, scrollTabIntoView],
  );

  React.useEffect(() => {
    if (activeNotePath) {
      scrollTabIntoView(activeNotePath);
    }
  }, [activeNotePath, scrollTabIntoView]);

  return (
    <div className="app-tabs" role="tablist" aria-label="Open notes">
      <div className="app-tabs__left-controls">
        {showWindowControls && (
          <WindowControls variant={isMac ? "mac" : "default"} />
        )}
        {onToggleLeftSidebar && !isLeftSidebarOpen && (
          <Tooltip content="Expand sidebar" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className="app-tabs__action-btn app-tabs__sidebar-toggle-btn"
              onClick={onToggleLeftSidebar}
              aria-label="Expand sidebar"
            >
              <SidebarSimple size={15} />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="app-tabs__strip" ref={tabStripRef}>
        {openNotes.map((path) => {
          const isCanvas = path.endsWith(".canvas");
          const displayTitle =
            path
              .replace(/\.(md|canvas)$/i, "")
              .split("/")
              .pop() ?? path;
          const isActive = activeNotePath === path;
          const isDirty = dirtyNotes.has(path);
          const hasConflict = conflictNotes?.has(path) ?? false;
          return (
            <div
              key={path}
              className="app-tabs__tab"
              role="tab"
              tabIndex={0}
              aria-selected={isActive}
              data-active={isActive || undefined}
              data-tab-path={path}
              onClick={() => handleSelectNote(path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectNote(path);
                }
              }}
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
              {hasConflict ? (
                <span
                  className="app-tabs__conflict-dot"
                  title="Disk conflict"
                  aria-label="Disk conflict"
                />
              ) : (
                isDirty && <span className="app-tabs__dirty-dot" />
              )}
              <button
                type="button"
                className="app-tabs__close"
                aria-label={`Close ${displayTitle}`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onCloseNote(path);
                }}
              >
                <X size={16} weight="regular" />
              </button>
            </div>
          );
        })}

        {onCreateNote && (
          <Tooltip content="Create new note" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className="app-tabs__new-btn"
              onClick={() => void onCreateNote()}
              aria-label="Create new note"
            >
              <Plus size={14} />
            </button>
          </Tooltip>
        )}
        <div
          className="app-tabs__drag-region"
          data-tauri-drag-region
          onDoubleClick={() => {
            if (hasPlatformAdapters()) {
              void getPlatformAdapters().windowControls.maximize();
            }
          }}
        />
      </div>

      <div className="app-tabs__actions">
        <TabListDropdown
          openNotes={openNotes}
          activeNotePath={activeNotePath}
          onSelectNote={handleSelectNote}
          onCloseAllNotes={onCloseAllNotes}
        />

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
