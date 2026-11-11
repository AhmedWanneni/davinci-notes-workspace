import React, { useState, useMemo } from "react";
import {
  MagnifyingGlass,
  FunnelSimple,
  Rows,
  SquaresFour,
  Record,
  Gear,
  Clock,
  SpeakerHigh,
  CheckSquare,
  ChatCircleText,
  Robot,
} from "@phosphor-icons/react";
import type { ParsedMeetingItem } from "./meetingsParser";
import { MeetingsBoardView } from "./MeetingsBoardView";
import { MeetingShowcaseEmpty } from "./MeetingShowcaseEmpty";
import styles from "./ListeningView.module.scss";

export interface AllMeetingsViewProps {
  meetings: ParsedMeetingItem[];
  onSelectMeeting: (meeting: ParsedMeetingItem) => void;
  onStartNewRecording: () => void;
  onOpenSettings?: () => void;
  isAssistantOpen?: boolean;
  onToggleAssistant?: () => void;
}

export function AllMeetingsView({
  meetings,
  onSelectMeeting,
  onStartNewRecording,
  onOpenSettings,
  isAssistantOpen = true,
  onToggleAssistant,
}: AllMeetingsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  const filteredMeetings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();

    return meetings.filter((m) => {
      // Date filter
      if (dateFilter !== "all" && m.date) {
        const d = new Date(m.date);
        if (!isNaN(d.getTime())) {
          const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          if (dateFilter === "today" && diffDays > 1) return false;
          if (dateFilter === "week" && diffDays > 7) return false;
          if (dateFilter === "month" && diffDays > 30) return false;
        }
      }

      // Search query filter
      if (!q) return true;
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSummary = m.summary.toLowerCase().includes(q);
      const matchActions = m.actionItems.some((a) => a.toLowerCase().includes(q));
      const matchAnswers = m.answers.some(
        (ans) => ans.question.toLowerCase().includes(q) || ans.answer.toLowerCase().includes(q),
      );
      return matchTitle || matchSummary || matchActions || matchAnswers;
    });
  }, [meetings, searchQuery, dateFilter]);

  return (
    <div className={styles["all-meetings-view"]} data-testid="all-meetings-view">
      <div className={styles["all-meetings-action-bar"]}>
        <div className={styles["search-input-group"]}>
          <MagnifyingGlass size={15} className={styles["search-icon"]} />
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="Search meetings by title, summary, or thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search meetings"
            data-testid="meetings-search-input"
          />
        </div>

        <div className={styles["action-bar-controls"]}>
          <div className={styles["filter-select-group"]}>
            <FunnelSimple size={14} />
            <select
              className={styles["filter-select"]}
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "all" | "today" | "week" | "month")
              }
              data-testid="meetings-date-filter"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className={styles["view-toggle-group"]}>
            <button
              type="button"
              className={`${styles["view-toggle-btn"]} ${viewMode === "list" ? styles["is-active"] : ""}`}
              onClick={() => setViewMode("list")}
              title="List view"
              data-testid="view-toggle-list"
            >
              <Rows size={16} />
            </button>
            <button
              type="button"
              className={`${styles["view-toggle-btn"]} ${viewMode === "board" ? styles["is-active"] : ""}`}
              onClick={() => setViewMode("board")}
              title="Board view"
              data-testid="view-toggle-board"
            >
              <SquaresFour size={16} />
            </button>
          </div>

          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--primary"]}`}
            onClick={onStartNewRecording}
            data-testid="all-meetings-record-btn"
          >
            <Record size={15} weight="fill" />
            <span>Record</span>
          </button>

          {onToggleAssistant && (
            <button
              type="button"
              className={`${styles["settings-icon-btn"]} ${isAssistantOpen ? styles["is-active"] : ""}`}
              onClick={onToggleAssistant}
              title={isAssistantOpen ? "Hide Ask Fred assistant" : "Open Ask Fred assistant"}
              data-testid="toggle-assistant-btn"
            >
              <Robot size={16} weight={isAssistantOpen ? "fill" : "regular"} />
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              className={styles["settings-icon-btn"]}
              onClick={onOpenSettings}
              title="Recording & AI Listening Settings"
              data-testid="meetings-settings-btn"
            >
              <Gear size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles["all-meetings-content"]}>
        {filteredMeetings.length === 0 ? (
          meetings.length === 0 ? (
            <MeetingShowcaseEmpty onStartRecording={onStartNewRecording} />
          ) : (
            <div className={styles["empty-meetings-state"]} data-testid="empty-meetings-state">
              <h3 className={styles["empty-title"]}>No meetings match your filter</h3>
              <p className={styles["empty-desc"]}>
                Try clearing your search query or choosing a broader date filter.
              </p>
            </div>
          )
        ) : viewMode === "board" ? (
          <MeetingsBoardView
            meetings={filteredMeetings}
            onSelectMeeting={onSelectMeeting}
          />
        ) : (
          <div className={styles["meetings-list-feed"]} data-testid="meetings-list-feed">
            {filteredMeetings.map((m) => (
              <div
                key={m.path}
                className={styles["meeting-list-row"]}
                onClick={() => onSelectMeeting(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectMeeting(m);
                }}
                data-testid={`meeting-row-${m.title}`}
              >
                <div className={styles["row-main-info"]}>
                  <div className={styles["row-title-bar"]}>
                    <h3 className={styles["row-title"]}>{m.title}</h3>
                    {m.audioFileName && (
                      <span className={styles["audio-badge"]} title="Has audio recording">
                        <SpeakerHigh size={13} />
                        <span>Audio</span>
                      </span>
                    )}
                  </div>
                  {m.summary && (
                    <p className={styles["row-summary-snippet"]}>
                      {m.summary.slice(0, 160)}
                      {m.summary.length > 160 ? "..." : ""}
                    </p>
                  )}
                </div>

                <div className={styles["row-meta-info"]}>
                  <span className={styles["row-date"]}>{m.date || "Recent"}</span>
                  <div className={styles["row-badges"]}>
                    {m.durationSeconds > 0 && (
                      <span className={styles["pill-badge"]}>
                        <Clock size={12} />
                        <span>{Math.round(m.durationSeconds / 60)}m</span>
                      </span>
                    )}
                    {m.actionItems.length > 0 && (
                      <span className={styles["pill-badge"]}>
                        <CheckSquare size={12} />
                        <span>{m.actionItems.length} actions</span>
                      </span>
                    )}
                    {m.answers.length > 0 && (
                      <span className={styles["pill-badge"]}>
                        <ChatCircleText size={12} />
                        <span>{m.answers.length} Q&A</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
