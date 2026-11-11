import type { JSX } from "react";
import {
  BookmarkSimple,
  Files,
  MagnifyingGlass,
  ShareNetwork,
  CalendarBlank,
  CalendarCheck,
  FrameCorners,
  Sparkle,
  Ear,
  GitBranch,
  CheckSquare,
} from "@phosphor-icons/react";
import { IconRailButton } from "./IconRailButton";

export interface IconRailTopGroupProps {
  onToggleLeftSidebar: () => void;
  onOpenFiles?: () => void;
  onOpenSearch: () => void;
  onOpenGlobalGraph: () => void;
  onDailyNotes?: () => void;
  onCreateCanvas?: () => void;
  onOpenTodos?: () => void;
  onOpenCalendar?: () => void;
  onOpenBookmarks?: () => void;
  onOpenAgent?: () => void;
  onOpenListening?: () => void;
  onOpenReminders?: () => void;
  onOpenAskVault?: () => void;
  isGlobalGraphOpen?: boolean;
  isCalendarOpen?: boolean;
  isBookmarksOpen?: boolean;
  isTodosOpen?: boolean;
  isAgentOpen?: boolean;
  isListeningOpen?: boolean;
  isRemindersOpen?: boolean;
  isAskVaultOpen?: boolean;
  isGitManagerOpen?: boolean;
  isGitEnabled?: boolean;
  onOpenGitManager?: () => void;
}

export function IconRailTopGroup({
  onToggleLeftSidebar,
  onOpenFiles,
  onOpenSearch,
  onOpenGlobalGraph,
  onDailyNotes,
  onCreateCanvas,
  onOpenTodos,
  onOpenCalendar,
  onOpenBookmarks,
  onOpenAgent,
  onOpenListening,
  isGlobalGraphOpen,
  isCalendarOpen,
  isBookmarksOpen,
  isTodosOpen,
  isAgentOpen,
  isListeningOpen,
  isGitManagerOpen,
  isGitEnabled,
  onOpenGitManager,
}: IconRailTopGroupProps): JSX.Element {
  const isFilesActive =
    !isBookmarksOpen &&
    !isGitManagerOpen &&
    !isTodosOpen &&
    !isListeningOpen &&
    !isAgentOpen &&
    !isCalendarOpen;

  const handleToggle = (isActive?: boolean, onOpen?: () => void) => () => {
    if (isActive) {
      onToggleLeftSidebar();
    } else if (onOpen) {
      onOpen();
    } else {
      onToggleLeftSidebar();
    }
  };

  return (
    <div className="icon-rail__group icon-rail__group--top">
      <IconRailButton
        label="Files"
        tooltip="Files (Toggle sidebar)"
        isActive={isFilesActive}
        onClick={handleToggle(isFilesActive, onOpenFiles)}
      >
        <Files size={18} weight="regular" />
      </IconRailButton>

      {onOpenBookmarks && (
        <IconRailButton
          label="Bookmarks"
          tooltip="Bookmarks (Toggle sidebar)"
          isActive={isBookmarksOpen}
          onClick={handleToggle(isBookmarksOpen, onOpenBookmarks)}
        >
          <BookmarkSimple size={18} weight={isBookmarksOpen ? "fill" : "regular"} />
        </IconRailButton>
      )}

      {isGitEnabled && onOpenGitManager && (
        <IconRailButton
          label="Source Control"
          tooltip="Source Control (Git) (Toggle sidebar)"
          isActive={isGitManagerOpen}
          onClick={handleToggle(isGitManagerOpen, onOpenGitManager)}
        >
          <GitBranch size={18} weight={isGitManagerOpen ? "bold" : "regular"} />
        </IconRailButton>
      )}

      {onOpenAgent && (
        <IconRailButton
          label="AI Agent"
          tooltip="AI Agent (Toggle sidebar)"
          isActive={isAgentOpen}
          ariaPressed={isAgentOpen}
          onClick={handleToggle(isAgentOpen, onOpenAgent)}
        >
          <Sparkle size={18} weight={isAgentOpen ? "fill" : "regular"} />
        </IconRailButton>
      )}

      {onOpenListening && (
        <IconRailButton
          label="AI Listening"
          tooltip="Meeting Recorder & AI Listening (Toggle sidebar)"
          isActive={isListeningOpen}
          onClick={handleToggle(isListeningOpen, onOpenListening)}
        >
          <Ear size={18} weight={isListeningOpen ? "fill" : "regular"} />
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
          tooltip="Calendar & Meetings (Toggle sidebar)"
          isActive={isCalendarOpen}
          onClick={handleToggle(isCalendarOpen, onOpenCalendar)}
        >
          <CalendarCheck size={18} weight="regular" />
        </IconRailButton>
      )}

      {onCreateCanvas && (
        <IconRailButton label="New canvas" onClick={onCreateCanvas}>
          <FrameCorners size={18} weight="regular" />
        </IconRailButton>
      )}

      {onOpenTodos && (
        <IconRailButton
          label="Todos"
          tooltip="Todos & Tasks (Toggle sidebar)"
          isActive={isTodosOpen}
          onClick={handleToggle(isTodosOpen, onOpenTodos)}
        >
          <CheckSquare size={18} weight={isTodosOpen ? "fill" : "regular"} />
        </IconRailButton>
      )}
    </div>
  );
}
