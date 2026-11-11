import React from "react";
import { Clock, SpeakerHigh, CheckSquare, ChatCircleText } from "@phosphor-icons/react";
import type { ParsedMeetingItem } from "./meetingsParser";
import styles from "./ListeningView.module.scss";

export interface MeetingsBoardViewProps {
  meetings: ParsedMeetingItem[];
  onSelectMeeting: (meeting: ParsedMeetingItem) => void;
}

interface ColumnGroup {
  id: string;
  title: string;
  items: ParsedMeetingItem[];
}

function categorizeMeetings(meetings: ParsedMeetingItem[]): ColumnGroup[] {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const thisWeek: ParsedMeetingItem[] = [];
  const thisMonth: ParsedMeetingItem[] = [];
  const earlier: ParsedMeetingItem[] = [];

  for (const m of meetings) {
    const d = m.date ? new Date(m.date) : null;
    if (d && !isNaN(d.getTime())) {
      if (d >= oneWeekAgo) {
        thisWeek.push(m);
      } else if (d >= oneMonthAgo) {
        thisMonth.push(m);
      } else {
        earlier.push(m);
      }
    } else {
      thisWeek.push(m);
    }
  }

  return [
    { id: "week", title: "This Week", items: thisWeek },
    { id: "month", title: "This Month", items: thisMonth },
    { id: "earlier", title: "Earlier", items: earlier },
  ];
}

export function MeetingsBoardView({ meetings, onSelectMeeting }: MeetingsBoardViewProps) {
  const columns = categorizeMeetings(meetings);

  return (
    <div className={styles["meetings-board-view"]} data-testid="meetings-board-view">
      {columns.map((col) => (
        <div key={col.id} className={styles["board-column"]}>
          <div className={styles["board-column__header"]}>
            <span className={styles["column-title"]}>{col.title}</span>
            <span className={styles["column-count"]}>{col.items.length}</span>
          </div>

          <div className={styles["board-column__cards"]}>
            {col.items.length === 0 ? (
              <div className={styles["column-empty"]}>No meetings</div>
            ) : (
              col.items.map((m) => (
                <div
                  key={m.path}
                  className={styles["meeting-board-card"]}
                  onClick={() => onSelectMeeting(m)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectMeeting(m);
                  }}
                  data-testid={`board-card-${m.title}`}
                >
                  <div className={styles["board-card-header"]}>
                    <h4 className={styles["board-card-title"]}>{m.title}</h4>
                    {m.audioFileName && (
                      <span className={styles["audio-indicator"]} title="Has audio recording">
                        <SpeakerHigh size={13} />
                      </span>
                    )}
                  </div>

                  {m.summary && (
                    <p className={styles["board-card-summary"]}>
                      {m.summary.slice(0, 110)}
                      {m.summary.length > 110 ? "..." : ""}
                    </p>
                  )}

                  <div className={styles["board-card-footer"]}>
                    <span className={styles["board-card-date"]}>{m.date}</span>
                    <div className={styles["board-card-badges"]}>
                      {m.durationSeconds > 0 && (
                        <span className={styles["mini-badge"]}>
                          <Clock size={11} />
                          <span>{Math.round(m.durationSeconds / 60)}m</span>
                        </span>
                      )}
                      {m.actionItems.length > 0 && (
                        <span className={styles["mini-badge"]}>
                          <CheckSquare size={11} />
                          <span>{m.actionItems.length}</span>
                        </span>
                      )}
                      {m.answers.length > 0 && (
                        <span className={styles["mini-badge"]}>
                          <ChatCircleText size={11} />
                          <span>{m.answers.length}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
