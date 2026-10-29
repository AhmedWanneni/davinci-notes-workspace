// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CalendarToolbar } from "./CalendarToolbar";

describe("CalendarToolbar", () => {
  const defaultProps = {
    currentView: "month-grid" as const,
    onViewChange: vi.fn(),
    periodLabel: "October 2026",
    onToday: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
  };

  it("renders period label and view options", () => {
    render(<CalendarToolbar {...defaultProps} />);

    expect(screen.getByTestId("calendar-period-label").textContent).toBe("October 2026");
    expect(screen.getByTestId("calendar-view-month-grid").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("calendar-view-week").getAttribute("aria-selected")).toBe("false");
    expect(screen.getByTestId("calendar-view-day").getAttribute("aria-selected")).toBe("false");
    expect(screen.getByTestId("calendar-view-month-agenda").getAttribute("aria-selected")).toBe("false");
  });

  it("triggers navigation callbacks when Today, Prev, Next are clicked", () => {
    const onToday = vi.fn();
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(
      <CalendarToolbar
        {...defaultProps}
        onToday={onToday}
        onPrev={onPrev}
        onNext={onNext}
      />,
    );

    fireEvent.click(screen.getByTestId("calendar-nav-today"));
    expect(onToday).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("calendar-nav-prev"));
    expect(onPrev).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("calendar-nav-next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("calls onViewChange when switching view modes", () => {
    const onViewChange = vi.fn();
    render(<CalendarToolbar {...defaultProps} onViewChange={onViewChange} />);

    fireEvent.click(screen.getByTestId("calendar-view-week"));
    expect(onViewChange).toHaveBeenCalledWith("week");

    fireEvent.click(screen.getByTestId("calendar-view-day"));
    expect(onViewChange).toHaveBeenCalledWith("day");

    fireEvent.click(screen.getByTestId("calendar-view-month-agenda"));
    expect(onViewChange).toHaveBeenCalledWith("month-agenda");
  });

  it("renders action buttons when handlers are provided", () => {
    const onCreateEvent = vi.fn();
    const onSync = vi.fn();
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();

    render(
      <CalendarToolbar
        {...defaultProps}
        onCreateEvent={onCreateEvent}
        onSync={onSync}
        onOpenSettings={onOpenSettings}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId("calendar-create-event-btn"));
    expect(onCreateEvent).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("calendar-sync-btn"));
    expect(onSync).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("calendar-settings-btn"));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("calendar-close-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
