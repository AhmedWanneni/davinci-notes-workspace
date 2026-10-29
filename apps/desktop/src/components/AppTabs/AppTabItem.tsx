import React from "react";
import {
  BookmarkSimple,
  CalendarCheck,
  Bell,
  Sparkle,
  FileText,
  FrameCorners,
  Kanban as KanbanIcon,
  Table as TableIcon,
  Image as ImageIcon,
  X,
  Ear,
} from "@phosphor-icons/react";
import { BOOKMARKS_TAB_ID } from "../../bookmarks";
import { CALENDAR_TAB_ID } from "../../calendar/calendarConstants";
import { AGENT_TAB_ID } from "../AgentView/agentTypes";
import { REMINDERS_TAB_ID } from "../../reminders/reminderConstants";
import { LISTENING_TAB_ID } from "../ListeningView/listeningConstants";
import { isImagePath } from "../ImagePreview/imagePreviewUtils";

export interface AppTabItemProps {
  path: string;
  isActive: boolean;
  isDirty: boolean;
  hasConflict: boolean;
  isBoard?: boolean;
  isDatabase?: boolean;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function AppTabItem({
  path,
  isActive,
  isDirty,
  hasConflict,
  isBoard,
  isDatabase,
  onSelect,
  onClose,
}: AppTabItemProps) {
  const isBookmarksTab = path === BOOKMARKS_TAB_ID;
  const isRemindersTab = path === REMINDERS_TAB_ID;
  const isAgentTab = path === AGENT_TAB_ID;
  const isCalendarTab = path === CALENDAR_TAB_ID;
  const isListeningTab = path === LISTENING_TAB_ID;
  const isGitDiff = path.startsWith("git-diff://");
  const isCanvas = path.endsWith(".canvas");
  const isImage = isImagePath(path);

  let gitDiffTitle = "";
  let gitDiffStatus = "";
  if (isGitDiff) {
    const raw = path.slice("git-diff://".length);
    const [filePath, query] = raw.split("?");
    const fileName = filePath.split("/").pop() ?? filePath;
    const isStaged = query?.includes("staged=1");
    gitDiffTitle = `${fileName} (${isStaged ? "Index" : "Working Tree"})`;
    const statusMatch = query?.match(/status=([A-Z])/);
    gitDiffStatus = statusMatch ? statusMatch[1] : "M";
  }

  const displayTitle = isBookmarksTab
    ? "Bookmarks"
    : isRemindersTab
      ? "Reminders"
      : isAgentTab
        ? "AI Agent"
        : isCalendarTab
          ? "Calendar"
          : isListeningTab
            ? "AI Listening"
            : isGitDiff
              ? gitDiffTitle
              : isImage
                ? (path.split("/").pop() ?? path)
                : (path
                    .replace(/\.(md|canvas)$/i, "")
                    .split("/")
                    .pop() ?? path);

  return (
    <div
      className="app-tabs__tab"
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      data-active={isActive || undefined}
      data-tab-path={path}
      onClick={() => onSelect(path)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(path);
        }
      }}
      title={path}
    >
      <span className="app-tabs__tab-icon" aria-hidden="true">
        {isBookmarksTab ? (
          <BookmarkSimple size={13} weight="regular" />
        ) : isRemindersTab ? (
          <Bell size={13} weight="regular" />
        ) : isAgentTab ? (
          <Sparkle size={13} weight="fill" />
        ) : isCalendarTab ? (
          <CalendarCheck size={13} weight="regular" />
        ) : isListeningTab ? (
          <Ear size={13} weight="regular" />
        ) : isCanvas ? (
          <FrameCorners size={13} weight="regular" />
        ) : isBoard ? (
          <KanbanIcon size={13} weight="regular" />
        ) : isDatabase ? (
          <TableIcon size={13} weight="regular" />
        ) : isImage ? (
          <ImageIcon size={13} weight="regular" />
        ) : (
          <FileText size={13} weight="regular" />
        )}
      </span>

      <span className="app-tabs__tab-title">{displayTitle}</span>

      {isGitDiff && gitDiffStatus && (
        <span
          className="app-tabs__git-badge"
          data-status={gitDiffStatus}
          aria-label={`Git status ${gitDiffStatus}`}
        >
          {gitDiffStatus}
        </span>
      )}

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
          onClose(path);
        }}
      >
        <X size={16} weight="regular" />
      </button>
    </div>
  );
}
