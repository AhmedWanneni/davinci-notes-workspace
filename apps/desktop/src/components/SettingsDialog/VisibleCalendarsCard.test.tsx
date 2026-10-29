// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VisibleCalendarsCard } from "./VisibleCalendarsCard";

describe("VisibleCalendarsCard", () => {
  it("does not render when calendars array is empty", () => {
    const { container } = render(
      <VisibleCalendarsCard calendars={[]} onToggleCalendar={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders calendars when non-empty", () => {
    const calendars = [
      {
        id: "cal-1",
        summary: "Work Calendar",
        selected: true,
        primary: true,
      },
    ];

    render(
      <VisibleCalendarsCard calendars={calendars} onToggleCalendar={vi.fn()} />,
    );

    expect(screen.getByText("Visible Calendars")).toBeDefined();
    expect(screen.getByText("Work Calendar")).toBeDefined();
    expect(screen.getByText("Primary")).toBeDefined();
  });
});
