// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalendarPreferencesCard } from "./CalendarPreferencesCard";

describe("CalendarPreferencesCard", () => {
  it("renders preferences and handles inputs", () => {
    const onIntervalChange = vi.fn();
    const onMeetingsFolderChange = vi.fn();
    const onToggleDeclined = vi.fn();

    render(
      <CalendarPreferencesCard
        refreshInterval="15m"
        meetingsFolder="Meetings"
        showDeclined={false}
        onIntervalChange={onIntervalChange}
        onMeetingsFolderChange={onMeetingsFolderChange}
        onToggleDeclined={onToggleDeclined}
      />,
    );

    const select = screen.getByLabelText("Refresh Cadence");
    fireEvent.change(select, { target: { value: "30m" } });
    expect(onIntervalChange).toHaveBeenCalledWith("30m");

    const folderInput = screen.getByLabelText("Meeting Notes Folder");
    fireEvent.change(folderInput, { target: { value: "Notes/Meetings" } });
    expect(onMeetingsFolderChange).toHaveBeenCalledWith("Notes/Meetings");

    const toggle = screen.getByLabelText("Show Declined Events");
    fireEvent.click(toggle);
    expect(onToggleDeclined).toHaveBeenCalledWith(true);
  });
});
