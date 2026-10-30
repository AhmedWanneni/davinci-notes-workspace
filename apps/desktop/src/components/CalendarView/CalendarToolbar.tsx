import React from "react";
import { Button, Typography } from "@app/design-system";
import {
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  Gear,
  Plus,
  X,
} from "@phosphor-icons/react";
import styles from "./CalendarToolbar.module.scss";

export type CalendarViewMode = "month-grid" | "week" | "day" | "month-agenda";

export interface CalendarToolbarProps {
  currentView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  periodLabel: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  isSyncing?: boolean;
  onSync?: () => void;
  onCreateEvent?: () => void;
  onOpenSettings?: () => void;
  onClose?: () => void;
}

const VIEW_OPTIONS: { id: CalendarViewMode; label: string }[] = [
  { id: "month-grid", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "month-agenda", label: "Agenda" },
];

export function CalendarToolbar({
  currentView,
  onViewChange,
  periodLabel,
  onToday,
  onPrev,
  onNext,
  isSyncing = false,
  onSync,
  onCreateEvent,
  onOpenSettings,
  onClose,
}: CalendarToolbarProps) {
  return (
    <header className={styles["calendar-toolbar"]} data-testid="calendar-toolbar">
      <div className={styles["calendar-toolbar__nav"]}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onToday}
          data-testid="calendar-nav-today"
        >
          Today
        </Button>
        <div className={styles["calendar-toolbar__arrows"]}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            aria-label="Previous period"
            data-testid="calendar-nav-prev"
          >
            <CaretLeft size={16} weight="bold" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            aria-label="Next period"
            data-testid="calendar-nav-next"
          >
            <CaretRight size={16} weight="bold" />
          </Button>
        </div>
        <Typography
          variant="h2"
          size="sm"
          weight="semibold"
          className={styles["calendar-toolbar__period"]}
          data-testid="calendar-period-label"
        >
          {periodLabel}
        </Typography>
      </div>

      <div className={styles["calendar-toolbar__views"]}>
        <div className={styles["calendar-toolbar__segment"]} role="tablist">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={currentView === opt.id}
              className={`${styles["calendar-toolbar__view-btn"]} ${
                currentView === opt.id ? styles["is-active"] : ""
              }`}
              onClick={() => onViewChange(opt.id)}
              data-testid={`calendar-view-${opt.id}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles["calendar-toolbar__actions"]}>
        {onCreateEvent && (
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateEvent}
            data-testid="calendar-create-event-btn"
          >
            <Plus size={14} weight="bold" />
            <span>Event</span>
          </Button>
        )}

        {onSync && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            aria-label="Refresh calendar"
            data-testid="calendar-sync-btn"
          >
            <ArrowsClockwise
              size={15}
              weight="bold"
              className={isSyncing ? styles["calendar-toolbar__spin"] : undefined}
            />
          </Button>
        )}

        {onOpenSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            aria-label="Calendar Settings"
            data-testid="calendar-settings-btn"
          >
            <Gear size={15} weight="regular" />
          </Button>
        )}

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close calendar"
            data-testid="calendar-close-btn"
          >
            <X size={15} weight="bold" />
          </Button>
        )}
      </div>
    </header>
  );
}
