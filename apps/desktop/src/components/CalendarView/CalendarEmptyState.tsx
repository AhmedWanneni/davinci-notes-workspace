import React from "react";
import { Button, Typography } from "@app/design-system";
import { CalendarCheck, Gear } from "@phosphor-icons/react";
import styles from "./CalendarEmptyState.module.scss";

export interface CalendarEmptyStateProps {
  isConnecting?: boolean;
  onConnect: () => void;
  onOpenSettings?: () => void;
}

export function CalendarEmptyState({
  isConnecting = false,
  onConnect,
  onOpenSettings,
}: CalendarEmptyStateProps) {
  return (
    <div className={styles["calendar-empty"]} data-testid="calendar-empty-state">
      <div className={styles["calendar-empty__icon"]}>
        <CalendarCheck size={24} weight="regular" />
      </div>

      <Typography
        variant="h2"
        size="md"
        weight="semibold"
        className={styles["calendar-empty__title"]}
      >
        Connect Google Calendar
      </Typography>

      <Typography
        variant="text"
        size="sm"
        color="muted"
        className={styles["calendar-empty__desc"]}
      >
        View and manage your events in Month, Week, Day, and Agenda views, join
        Google Meet calls with one click, and create linked meeting notes in your
        local vault.
      </Typography>

      <div className={styles["calendar-empty__actions"]}>
        <Button
          variant="primary"
          size="md"
          onClick={onConnect}
          disabled={isConnecting}
          data-testid="calendar-connect-btn"
        >
          {isConnecting ? "Connecting..." : "Connect Google Calendar"}
        </Button>

        {onOpenSettings && (
          <Button
            variant="secondary"
            size="md"
            onClick={onOpenSettings}
            data-testid="calendar-empty-settings-btn"
          >
            <Gear size={16} weight="regular" />
            <span>Configure Client ID</span>
          </Button>
        )}
      </div>
    </div>
  );
}
