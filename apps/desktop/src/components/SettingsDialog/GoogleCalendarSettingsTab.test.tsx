// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleCalendarSettingsTab } from "./GoogleCalendarSettingsTab";
import * as auth from "../../calendar/desktopCalendarAuth";
import * as store from "../../calendar/sqliteCalendarStore";
import * as settings from "../../vault/settingsCommands";

vi.mock("../../calendar/desktopCalendarAuth", () => ({
  loadCalendarToken: vi.fn(),
  signInToCalendar: vi.fn(),
  disconnectCalendar: vi.fn(),
}));

vi.mock("@app/google-calendar-api", () => ({
  listCalendars: vi.fn().mockResolvedValue([
    {
      id: "cal-1",
      summary: "Work Calendar",
      primary: true,
      selected: true,
      backgroundColor: "#4285F4",
    },
  ]),
}));

vi.mock("../../calendar/sqliteCalendarStore", () => ({
  getCalendarsFromDb: vi.fn(),
  saveCalendarsToDb: vi.fn(),
  updateCalendarSelectedInDb: vi.fn(),
  purgeCalendarCache: vi.fn(),
}));

vi.mock("../../vault/sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../vault/settingsCommands", () => ({
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

describe("GoogleCalendarSettingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders disconnected state when token is null", async () => {
    vi.mocked(auth.loadCalendarToken).mockResolvedValue(null);

    render(<GoogleCalendarSettingsTab />);

    await waitFor(() => {
      expect(screen.getByTestId("connect-calendar-btn")).toBeDefined();
    });
    expect(screen.getByText("Not Connected")).toBeDefined();
  });

  it("renders connected state with calendars list and disconnect action", async () => {
    vi.mocked(auth.loadCalendarToken).mockResolvedValue({
      accessToken: "token-abc",
      expiresAt: Date.now() + 3600000,
    });
    vi.mocked(store.getCalendarsFromDb).mockResolvedValue([
      {
        id: "cal-primary",
        summary: "My Work",
        primary: true,
        selected: true,
        backgroundColor: "#4285F4",
      },
    ]);

    render(<GoogleCalendarSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Connected to Google")).toBeDefined();
    });
    expect(screen.getByText("My Work")).toBeDefined();
    expect(screen.getByTestId("disconnect-calendar-btn")).toBeDefined();

    // Disconnect click
    fireEvent.click(screen.getByTestId("disconnect-calendar-btn"));
    await waitFor(() => {
      expect(auth.disconnectCalendar).toHaveBeenCalled();
      expect(store.purgeCalendarCache).toHaveBeenCalled();
    });
  });

  it("toggles visible calendar checkbox and updates SQLite store", async () => {
    vi.mocked(auth.loadCalendarToken).mockResolvedValue({
      accessToken: "token-abc",
      expiresAt: Date.now() + 3600000,
    });
    vi.mocked(store.getCalendarsFromDb).mockResolvedValue([
      {
        id: "cal-toggle-1",
        summary: "Project Delta",
        primary: false,
        selected: true,
      },
    ]);

    render(<GoogleCalendarSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Project Delta")).toBeDefined();
    });

    const checkbox = screen.getByLabelText("Toggle visibility of Project Delta");
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(store.updateCalendarSelectedInDb).toHaveBeenCalledWith(
        "cal-toggle-1",
        false,
      );
    });
  });

  it("updates refresh cadence and meetings folder settings", async () => {
    vi.mocked(auth.loadCalendarToken).mockResolvedValue(null);

    render(<GoogleCalendarSettingsTab />);

    await waitFor(() => {
      expect(screen.getByLabelText("Refresh Cadence")).toBeDefined();
    });

    const select = screen.getByLabelText("Refresh Cadence");
    fireEvent.change(select, { target: { value: "30m" } });

    await waitFor(() => {
      expect(settings.setSetting).toHaveBeenCalledWith(
        expect.anything(),
        "calendar.refreshInterval",
        "30m",
      );
    });

    const folderInput = screen.getByLabelText("Meeting Notes Folder");
    fireEvent.change(folderInput, { target: { value: "Notes/Meetings" } });

    await waitFor(() => {
      expect(settings.setSetting).toHaveBeenCalledWith(
        expect.anything(),
        "calendar.meetingsFolder",
        "Notes/Meetings",
      );
    });
  });
});
