// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationsSettingsTab } from "./NotificationsSettingsTab";
import { setNotificationSecretTestMode } from "../../notifications";

const mockStore: Record<string, string> = {};

vi.mock("../../vault/sqliteIndex", () => ({
  withDbLock: <T,>(fn: () => Promise<T>) => fn(),
  withDbTransaction: <T,>(_db: unknown, fn: () => Promise<T>) => fn(),
  getVaultIndexDb: async () => ({
    select: async (_sql: string, bind?: unknown[]) => {
      const k = String(bind?.[0] ?? "");
      return mockStore[k] ? [{ value: mockStore[k] }] : [];
    },
    execute: async (_sql: string, bind?: unknown[]) => {
      if (bind && bind.length >= 2) {
        mockStore[String(bind[0])] = String(bind[1]);
      }
    },
  }),
}));

describe("NotificationsSettingsTab", () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    setNotificationSecretTestMode(true);
  });

  it("renders default Desktop Notification channel and connects/removes Slack & Telegram destinations", async () => {
    render(<NotificationsSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Desktop Notification")).toBeDefined();
    });

    // Open Add Slack Webhook form
    fireEvent.click(screen.getByText("Add Slack Webhook"));
    expect(screen.getByText(/Official Slack Webhooks Docs/i)).toBeDefined();

    const nameInput = screen.getByLabelText("Destination Name");
    fireEvent.change(nameInput, { target: { value: "#engineering" } });

    const webhookInput = screen.getByLabelText("Slack Webhook URL");
    fireEvent.change(webhookInput, {
      target: {
        value:
          "https://hooks.slack.com/services/T12345678/B12345678/ValidLookingToken123",
      },
    });

    fireEvent.click(screen.getByText("Save & Connect"));

    await waitFor(() => {
      expect(screen.getByText("#engineering")).toBeDefined();
    });

    // Verify Remove deletes destination
    const removeBtn = screen.getByLabelText("Remove #engineering");
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText("#engineering")).toBeNull();
    });
  });

  it("shows Experimental CallMeBot section with third-party privacy warning", async () => {
    render(<NotificationsSettingsTab />);

    await waitFor(() => {
      expect(
        screen.getByText(/WhatsApp via CallMeBot \(Experimental, Third-Party\)/i),
      ).toBeDefined();
    });

    fireEvent.click(screen.getByText("Enable CallMeBot"));
    expect(
      screen.getByText(/Experimental · Third-Party Service:/i),
    ).toBeDefined();
  });
});
