import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Tooltip,
} from "@app/design-system";
import {
  CaretDown,
  FileText,
  FrameCorners,
  Check,
  X,
} from "@phosphor-icons/react";

export interface TabListDropdownProps {
  openNotes: string[];
  activeNotePath: string | null;
  onSelectNote: (path: string) => void;
  onCloseAllNotes?: () => void;
}

export function TabListDropdown({
  openNotes,
  activeNotePath,
  onSelectNote,
  onCloseAllNotes,
}: TabListDropdownProps) {
  const hasTabs = openNotes.length > 0;

  return (
    <DropdownMenu>
      <Tooltip content="Open tabs" contentProps={{ side: "bottom" }}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="app-tabs__action-btn app-tabs__dropdown-trigger"
            aria-label="Open tabs list"
            disabled={!hasTabs}
          >
            <CaretDown size={14} weight="regular" />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="app-tabs__dropdown-content"
      >
        {openNotes.map((path) => {
          const isCanvas = path.endsWith(".canvas");
          const displayTitle =
            path
              .replace(/\.(md|canvas)$/i, "")
              .split("/")
              .pop() ?? path;
          const isActive = activeNotePath === path;

          return (
            <DropdownMenuItem
              key={path}
              className="app-tabs__dropdown-item"
              data-active={isActive || undefined}
              onClick={() => onSelectNote(path)}
            >
              <span className="app-tabs__dropdown-icon" aria-hidden="true">
                {isCanvas ? (
                  <FrameCorners size={14} weight="regular" />
                ) : (
                  <FileText size={14} weight="regular" />
                )}
              </span>
              <span className="app-tabs__dropdown-title" title={displayTitle}>
                {displayTitle}
              </span>
              <span className="app-tabs__dropdown-check" aria-hidden="true">
                {isActive && <Check size={13} weight="bold" />}
              </span>
            </DropdownMenuItem>
          );
        })}

        {hasTabs && (
          <>
            <DropdownMenuSeparator className="app-tabs__dropdown-separator" />
            <DropdownMenuItem
              className="app-tabs__dropdown-item app-tabs__dropdown-item--close-all"
              onClick={() => onCloseAllNotes?.()}
            >
              <span className="app-tabs__dropdown-icon" aria-hidden="true">
                <X size={14} weight="bold" />
              </span>
              <span className="app-tabs__dropdown-title">Close all</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
