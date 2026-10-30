// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MeetingPromptToast } from "./MeetingPromptToast";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

describe("MeetingPromptToast", () => {
  const sampleEvent: NormalizedCalendarEvent = {
    id: "evt-design-sync",
    calendarId: "primary",
    title: "Design System Review",
    startIso: new Date(Date.now() + 60 * 1000).toISOString(),
    endIso: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    isAllDay: false,
    meetUrl: "https://meet.google.com/abc-xyz",
    status: "confirmed",
  };

  it("renders event title and triggers start and dismiss callbacks", () => {
    const onStart = vi.fn();
    const onDismiss = vi.fn();

    render(
      <MeetingPromptToast
        event={sampleEvent}
        onStartListening={onStart}
        onDismiss={onDismiss}
      />,
    );

    expect(
      screen.getByText("Meeting starting: Design System Review"),
    ).toBeDefined();
    expect(
      screen.getByText("Would you like DaVinci to listen and take notes?"),
    ).toBeDefined();

    fireEvent.click(screen.getByText("Take AI Notes"));
    expect(onStart).toHaveBeenCalledWith(sampleEvent);

    fireEvent.click(screen.getByText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledWith("evt-design-sync");
  });
});
