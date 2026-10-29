// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CalendarEmptyState } from "./CalendarEmptyState";

describe("CalendarEmptyState", () => {
  it("renders title and triggers onConnect when clicked", () => {
    const onConnect = vi.fn();
    render(<CalendarEmptyState onConnect={onConnect} />);

    expect(screen.getByText("Connect Google Calendar", { selector: "h2" })).toBeDefined();
    const btn = screen.getByTestId("calendar-connect-btn");
    fireEvent.click(btn);
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("disables connect button when isConnecting is true", () => {
    const onConnect = vi.fn();
    render(<CalendarEmptyState isConnecting={true} onConnect={onConnect} />);

    const btn = screen.getByTestId("calendar-connect-btn");
    expect(btn.textContent).toBe("Connecting...");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders settings button when onOpenSettings is provided", () => {
    const onOpenSettings = vi.fn();
    render(<CalendarEmptyState onConnect={vi.fn()} onOpenSettings={onOpenSettings} />);

    const settingsBtn = screen.getByTestId("calendar-empty-settings-btn");
    fireEvent.click(settingsBtn);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
