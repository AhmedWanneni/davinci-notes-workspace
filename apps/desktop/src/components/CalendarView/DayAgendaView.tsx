import React, { useMemo } from "react";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { Typography } from "@app/design-system";
import { EventCard } from "./EventCard";
import styles from "./CalendarView.module.scss";

export interface DayAgendaViewProps {
  events: NormalizedCalendarEvent[];
  onJoinMeet?: (url: string) => void;
  onCreateNote?: (event: NormalizedCalendarEvent) => void;
}

export function DayAgendaView({ events, onJoinMeet, onCreateNote }: DayAgendaViewProps) {
  const { happeningNow, laterToday, upcoming } = useMemo(() => {
    const now = Date.now();
    const todayMidnight = new Date();
    todayMidnight.setHours(23, 59, 59, 999);
    const todayEnd = todayMidnight.getTime();

    const happeningNow: NormalizedCalendarEvent[] = [];
    const laterToday: NormalizedCalendarEvent[] = [];
    const upcoming: NormalizedCalendarEvent[] = [];

    for (const evt of events) {
      const start = new Date(evt.startIso).getTime();
      const end = new Date(evt.endIso).getTime();

      if (start <= now && end >= now) {
        happeningNow.push(evt);
      } else if (start > now && start <= todayEnd) {
        laterToday.push(evt);
      } else if (start > todayEnd) {
        upcoming.push(evt);
      } else {
        // Earlier today or past
        laterToday.push(evt);
      }
    }

    return { happeningNow, laterToday, upcoming };
  }, [events]);

  if (events.length === 0) {
    return (
      <div className={styles["agenda-empty"]} data-testid="agenda-empty">
        <Typography variant="text" size="sm" color="muted">
          No upcoming meetings scheduled for this period.
        </Typography>
      </div>
    );
  }

  return (
    <div className={styles["agenda-view"]}>
      {happeningNow.length > 0 && (
        <section className={styles["agenda-section"]} data-testid="agenda-section-now">
          <Typography variant="text" size="xs" weight="bold" className={styles["agenda-section__title"]}>
            HAPPENING NOW
          </Typography>
          <div className={styles["agenda-section__list"]}>
            {happeningNow.map((evt) => (
              <EventCard key={evt.id} event={evt} onJoinMeet={onJoinMeet} onCreateNote={onCreateNote} />
            ))}
          </div>
        </section>
      )}

      {laterToday.length > 0 && (
        <section className={styles["agenda-section"]} data-testid="agenda-section-today">
          <Typography variant="text" size="xs" weight="bold" className={styles["agenda-section__title"]}>
            TODAY
          </Typography>
          <div className={styles["agenda-section__list"]}>
            {laterToday.map((evt) => (
              <EventCard key={evt.id} event={evt} onJoinMeet={onJoinMeet} onCreateNote={onCreateNote} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className={styles["agenda-section"]} data-testid="agenda-section-upcoming">
          <Typography variant="text" size="xs" weight="bold" className={styles["agenda-section__title"]}>
            UPCOMING THIS WEEK
          </Typography>
          <div className={styles["agenda-section__list"]}>
            {upcoming.map((evt) => (
              <EventCard key={evt.id} event={evt} onJoinMeet={onJoinMeet} onCreateNote={onCreateNote} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
