import {
  Files,
  MagnifyingGlass,
  ShareNetwork,
  CalendarBlank,
  Gear,
  SignOut,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";

export interface IconRailProps {
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onOpenCommandPalette: () => void;
  onOpenGlobalGraph: () => void;
  onOpenSettings: () => void;
  onCloseVault: () => void;
  onDailyNotes?: () => void;
}

export function IconRail({
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  onOpenCommandPalette,
  onOpenGlobalGraph,
  onOpenSettings,
  onCloseVault,
  onDailyNotes,
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
          content="Search everywhere (Cmd+K)"
          contentProps={{ side: "right" }}
        >
          <button
            type="button"
            className="icon-rail__btn"
            onClick={onOpenCommandPalette}
            aria-label="Search"
          >
            <MagnifyingGlass size={18} weight="regular" />
          </button>
        </Tooltip>

        <Tooltip content="Graph view" contentProps={{ side: "right" }}>
          <button
            type="button"
            className="icon-rail__btn"
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
