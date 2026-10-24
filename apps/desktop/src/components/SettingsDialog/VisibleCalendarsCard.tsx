import React from "react";
import { Checkbox, Typography } from "@app/design-system";
import type { CalendarListEntry } from "@app/google-calendar-api";
import { SettingsCard } from "./SettingsCard";
import styles from "./GoogleCalendarSettingsTab.module.scss";

export interface VisibleCalendarsCardProps {
  calendars: CalendarListEntry[];
  onToggleCalendar: (id: string, selected: boolean) => void;
}

export function VisibleCalendarsCard({
  calendars,
  onToggleCalendar,
}: VisibleCalendarsCardProps) {
  return (
    <SettingsCard title="Visible Calendars">
      {calendars.length === 0 ? (
        <Typography variant="text" size="xs" color="muted">
          No calendars found.
        </Typography>
      ) : (
        <div className={styles["calendar-settings-list"]}>
          {calendars.map((cal) => (
            <div key={cal.id} className={styles["calendar-item"]}>
              <div className={styles["calendar-info"]}>
                <div
                  className={styles["calendar-color-dot"]}
                  style={{
                    backgroundColor:
                      cal.backgroundColor || "var(--color-interactive-accent)",
                  }}
                />
                <span className={styles["calendar-title"]}>{cal.summary}</span>
                {cal.primary && (
                  <span className={styles["calendar-primary-badge"]}>
                    Primary
                  </span>
                )}
              </div>
              <Checkbox
                checked={cal.selected}
                onCheckedChange={(checked) =>
                  onToggleCalendar(cal.id, checked === true)
                }
                aria-label={`Toggle visibility of ${cal.summary}`}
              />
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  );
}
