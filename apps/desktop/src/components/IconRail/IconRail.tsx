import {
  Files,
  MagnifyingGlass,
  ShareNetwork,
  CalendarBlank,
  FrameCorners,
  Bell,
  Gear,
  SignOut,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";

export interface IconRailProps {
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onOpenSearch: () => void;
  onOpenGlobalGraph: () => void;
  onOpenSettings: () => void;
  onCloseVault: () => void;
  onDailyNotes?: () => void;
  onCreateCanvas?: () => void;
  onOpenReminders?: () => void;
  isGlobalGraphOpen?: boolean;
}

export function IconRail({
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  onOpenSearch,
  onOpenGlobalGraph,
  onOpenSettings,
  onCloseVault,
  onDailyNotes,
  onCreateCanvas,
  onOpenReminders,
  isGlobalGraphOpen,
}: IconRailProps) {
  return (
    <nav className="icon-rail" aria-label="Primary navigation">
      <div className="icon-rail__group icon-rail__group--top">
        <Tooltip
          content="Files (Toggle sidebar)"
          contentProps={{ side: "right" }}
        >
          <button
            type="button"
            className="icon-rail__btn"
            data-active={isLeftSidebarOpen || undefined}
            onClick={onToggleLeftSidebar}
            aria-label="Files"
          >
            <Files size={18} weight="regular" />
          </button>
        </Tooltip>

        <Tooltip
          content="Search note content (Cmd+P / Cmd+Shift+F)"
          contentProps={{ side: "right" }}
        >
          <button
            type="button"
            className="icon-rail__btn"
            onClick={onOpenSearch}
            aria-label="Search"
          >
            <MagnifyingGlass size={18} weight="regular" />
          </button>
        </Tooltip>

        <Tooltip content="Graph view" contentProps={{ side: "right" }}>
          <button
            type="button"
            className="icon-rail__btn"
            data-active={isGlobalGraphOpen || undefined}
            onClick={onOpenGlobalGraph}
            aria-label="Graph view"
          >
            <ShareNetwork size={18} weight="regular" />
          </button>
        </Tooltip>

        <Tooltip content="Daily note" contentProps={{ side: "right" }}>
          <button
            type="button"
            className="icon-rail__btn"
            onClick={onDailyNotes}
            aria-label="Daily note"
          >
            <CalendarBlank size={18} weight="regular" />
          </button>
        </Tooltip>

        {onCreateCanvas && (
          <Tooltip content="New canvas" contentProps={{ side: "right" }}>
            <button
              type="button"
              className="icon-rail__btn"
              onClick={onCreateCanvas}
              aria-label="New canvas"
            >
              <FrameCorners size={18} weight="regular" />
            </button>
          </Tooltip>
        )}

        {onOpenReminders && (
          <Tooltip content="Reminders" contentProps={{ side: "right" }}>
            <button
              type="button"
              className="icon-rail__btn"
              onClick={onOpenReminders}
              aria-label="Reminders"
            >
              <Bell size={18} weight="regular" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="icon-rail__group icon-rail__group--bottom">
        <Tooltip content="Settings" contentProps={{ side: "right" }}>
          <button
            type="button"
            className="icon-rail__btn"
            onClick={onOpenSettings}
            aria-label="Settings"
          >
            <Gear size={18} weight="regular" />
          </button>
        </Tooltip>

        <Tooltip content="Close vault" contentProps={{ side: "right" }}>
          <button
            type="button"
            className="icon-rail__btn"
            onClick={onCloseVault}
            aria-label="Close vault"
          >
            <SignOut size={18} weight="regular" />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}
