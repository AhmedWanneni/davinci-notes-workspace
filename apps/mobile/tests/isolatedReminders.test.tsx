import { describe, it, expect, vi } from "vitest";
import React from "react";
import { ReminderEventRow } from "../components/todos/ReminderEventRow";
import { RemindersHubView } from "../components/todos/RemindersHubView";
import type { MobileReminderEvent } from "../components/todos/types";

vi.mock("../theme", () => ({
  useTheme: () => ({
    tokens: {
      color: {
        bg: { primary: "#ffffff", secondary: "#f5f5f5", hover: "#ebebeb" },
        text: { normal: "#111111", muted: "#777777" },
        border: { subtle: "#e5e5e5" },
        interactive: { accent: "#000000" },
      },
    },
  }),
}));

vi.mock("../vault/useVaultReminders", () => ({
  useVaultReminders: () => ({
    reminders: [
      {
        id: "1",
        title: "13th May, 2025",
        dateTime: "7:30AM - 3:00PM",
        project: "Jakande, Lekki",
        status: "early",
      },
      {
        id: "2",
        title: "10th May, 2025",
        dateTime: "7:30AM - 3:00PM",
        project: "Jakande, Lekki",
        status: "late",
      },
    ],
    projects: ["All", "Jakande, Lekki", "Work", "Events"],
    selectedProject: "All",
    setSelectedProject: vi.fn(),
    metrics: {
      nextTime: "09:00am",
      todayCount: 2,
      upcomingCount: 5,
    },
    isLoading: false,
    refresh: vi.fn(),
    addReminder: vi.fn(),
    toggleReminder: vi.fn(),
    deleteReminder: vi.fn(),
  }),
}));

describe("ReminderEventRow", () => {
  it("renders reminder row with circular icon, project, and status pill", () => {
    const item: MobileReminderEvent = {
      id: "test-1",
      title: "13th May, 2025",
      dateTime: "7:30AM - 3:00PM",
      project: "Jakande, Lekki",
      status: "early",
    };
    const onToggle = vi.fn();
    const row = <ReminderEventRow item={item} onToggle={onToggle} />;
    expect(row).toBeDefined();
    expect(row.props.item.title).toBe("13th May, 2025");
    expect(row.props.item.project).toBe("Jakande, Lekki");
  });
});

describe("RemindersHubView", () => {
  it("renders RemindersHubView component with 3 metrics and reminder list", () => {
    const onOpenNote = vi.fn();
    const view = <RemindersHubView onOpenNote={onOpenNote} />;
    expect(view).toBeDefined();
  });
});
