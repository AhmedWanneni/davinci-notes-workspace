import React from "react";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { Button, Typography } from "@app/design-system";
import { FileText, MapPin, Users } from "@phosphor-icons/react";
import { MeetJoinButton } from "./MeetJoinButton";
import styles from "./CalendarView.module.scss";

export interface EventCardProps {
  event: NormalizedCalendarEvent;
  onJoinMeet?: (url: string) => void;
  onCreateNote?: (event: NormalizedCalendarEvent) => void;
}

function formatEventTime(event: NormalizedCalendarEvent): string {
  if (event.isAllDay) return "All day";
  try {
    const start = new Date(event.startIso);
    const end = new Date(event.endIso);
    const startStr = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const endStr = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `${startStr} – ${endStr}`;
  } catch {
    return event.startIso;
  }
}

export function EventCard({ event, onJoinMeet, onCreateNote }: EventCardProps) {
  const timeText = formatEventTime(event);
  const attendeeCount = event.attendees.length;

  return (
    <article className={styles["event-card"]} data-testid={`event-card-${event.id}`}>
      <div className={styles["event-card__main"]}>
        <div className={styles["event-card__time-badge"]}>{timeText}</div>
        <Typography variant="text" size="sm" weight="semibold" className={styles["event-card__title"]}>
          {event.title}
        </Typography>

        <div className={styles["event-card__meta"]}>
          {event.location && (
            <span className={styles["event-card__meta-item"]}>
              <MapPin size={13} weight="regular" />
              <span>{event.location}</span>
            </span>
          )}
          {attendeeCount > 0 && (
            <span className={styles["event-card__meta-item"]}>
              <Users size={13} weight="regular" />
              <span>{attendeeCount} attendee{attendeeCount > 1 ? "s" : ""}</span>
            </span>
          )}
        </div>
      </div>

      <div className={styles["event-card__actions"]}>
        {event.meetUrl && (
          <MeetJoinButton meetUrl={event.meetUrl} onJoin={onJoinMeet} />
        )}
        {onCreateNote && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onCreateNote(event)}
            aria-label="Create Meeting Note"
            data-testid={`create-note-btn-${event.id}`}
          >
            <FileText size={15} weight="regular" />
            <span>Take Notes</span>
          </Button>
        )}
      </div>
    </article>
  );
}
