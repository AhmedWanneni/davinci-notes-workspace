// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecordingTopBar } from "./RecordingTopBar";

describe("RecordingTopBar", () => {
  it("renders Filters and search buttons", () => {
    render(<RecordingTopBar />);
    expect(screen.getByText("Filters")).toBeTruthy();
    expect(screen.getByLabelText("Search meetings")).toBeTruthy();
  });

  it("renders settings button and triggers onOpenSettings when provided", () => {
    const handleOpenSettings = vi.fn();
    render(<RecordingTopBar onOpenSettings={handleOpenSettings} />);
    const settingsBtn = screen.getByTestId("record-view-settings-btn");
    expect(settingsBtn).toBeTruthy();
    fireEvent.click(settingsBtn);
    expect(handleOpenSettings).toHaveBeenCalledTimes(1);
  });
});
