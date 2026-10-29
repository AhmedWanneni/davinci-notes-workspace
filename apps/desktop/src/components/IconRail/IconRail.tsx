import {
  BookmarkSimple,
  Files,
  MagnifyingGlass,
  ShareNetwork,
  CalendarBlank,
  CalendarCheck,
  FrameCorners,
  Bell,
  Gear,
  SignOut,
  Sparkle,
  ChatCircleDots,
  Ear,
} from "@phosphor-icons/react";
import { IconRailButton } from "./IconRailButton";

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
  onOpenCalendar?: () => void;
  onOpenBookmarks?: () => void;
  onOpenAgent?: () => void;
  onOpenListening?: () => void;
  onOpenAskVault?: () => void;
  isGlobalGraphOpen?: boolean;
  isCalendarOpen?: boolean;
  isBookmarksOpen?: boolean;
  isRemindersOpen?: boolean;
  isAgentOpen?: boolean;
  isListeningOpen?: boolean;
  isAskVaultOpen?: boolean;
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
  onOpenCalendar,
  onOpenBookmarks,
  onOpenAgent,
  onOpenListening,
  onOpenAskVault,
  isGlobalGraphOpen,
  isCalendarOpen,
  isBookmarksOpen,
  isRemindersOpen,
  isAgentOpen,
  isListeningOpen,
  isAskVaultOpen,
}: IconRailProps) {
  return (
    <nav className="icon-rail" aria-label="Primary navigation">
      <div className="icon-rail__group icon-rail__group--top">
        <IconRailButton
          label="Files"
          tooltip="Files (Toggle sidebar)"
          isActive={isLeftSidebarOpen}
          onClick={onToggleLeftSidebar}
        >
          <Files size={18} weight="regular" />
        </IconRailButton>

        {onOpenBookmarks && (
          <IconRailButton
            label="Bookmarks"
            isActive={isBookmarksOpen}
            onClick={onOpenBookmarks}
          >
            <BookmarkSimple
              size={18}
              weight={isBookmarksOpen ? "fill" : "regular"}
            />
          </IconRailButton>
        )}

        {onOpenAgent && (
          <IconRailButton
            label="AI Agent"
            isActive={isAgentOpen}
            onClick={onOpenAgent}
          >
            <Sparkle size={18} weight={isAgentOpen ? "fill" : "regular"} />
          </IconRailButton>
        )}

        {onOpenListening && (
          <IconRailButton
            label="AI Listening"
            tooltip="Meeting Recorder & AI Listening"
            isActive={isListeningOpen}
            onClick={onOpenListening}
          >
            <Ear size={18} weight={isListeningOpen ? "fill" : "regular"} />
          </IconRailButton>
        )}

        {onOpenAskVault && (
          <IconRailButton
            label="Ask Your Vault"
            isActive={isAskVaultOpen}
            onClick={onOpenAskVault}
          >
            <ChatCircleDots
              size={18}
              weight={isAskVaultOpen ? "fill" : "regular"}
            />
          </IconRailButton>
        )}

        <IconRailButton
          label="Search"
          tooltip="Search note content (Cmd+P / Cmd+Shift+F)"
          onClick={onOpenSearch}
        >
          <MagnifyingGlass size={18} weight="regular" />
        </IconRailButton>

        <IconRailButton
          label="Graph view"
          isActive={isGlobalGraphOpen}
          onClick={onOpenGlobalGraph}
        >
          <ShareNetwork size={18} weight="regular" />
        </IconRailButton>

        <IconRailButton label="Daily note" onClick={onDailyNotes}>
          <CalendarBlank size={18} weight="regular" />
        </IconRailButton>

        {onOpenCalendar && (
          <IconRailButton
            label="Calendar"
            tooltip="Calendar & Meetings"
            isActive={isCalendarOpen}
            onClick={onOpenCalendar}
          >
            <CalendarCheck size={18} weight="regular" />
          </IconRailButton>
        )}

        {onCreateCanvas && (
          <IconRailButton label="New canvas" onClick={onCreateCanvas}>
            <FrameCorners size={18} weight="regular" />
          </IconRailButton>
        )}

        {onOpenReminders && (
          <IconRailButton
            label="Reminders"
            isActive={isRemindersOpen}
            onClick={onOpenReminders}
          >
            <Bell size={18} weight={isRemindersOpen ? "fill" : "regular"} />
          </IconRailButton>
        )}
      </div>

      <div className="icon-rail__group icon-rail__group--bottom">
        <IconRailButton label="Settings" onClick={onOpenSettings}>
          <Gear size={18} weight="regular" />
        </IconRailButton>

        <IconRailButton label="Close vault" onClick={onCloseVault}>
          <SignOut size={18} weight="regular" />
        </IconRailButton>
      </div>
    </nav>
  );
}
