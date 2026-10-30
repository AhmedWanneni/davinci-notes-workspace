// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UpdateSettingsCard } from "./UpdateSettingsCard";
import * as updaterService from "../../services/updaterService";

vi.mock("../../services/updaterService", () => ({
  checkAppUpdate: vi.fn(),
  downloadAndInstall: vi.fn(),
  restartApp: vi.fn(),
}));

describe("UpdateSettingsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders current version and check for updates button", () => {
    render(<UpdateSettingsCard />);
    expect(screen.getByText(/Version 0.1.0/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Check for Updates/i })).toBeDefined();
  });

  it("shows up-to-date status when no update available", async () => {
    vi.mocked(updaterService.checkAppUpdate).mockResolvedValueOnce({
      status: "up-to-date",
      currentVersion: "0.1.0",
    });

    render(<UpdateSettingsCard />);
    const button = screen.getByRole("button", { name: /Check for Updates/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/You are running the latest version/i)
      ).toBeDefined();
    });
  });

  it("shows available update and handles download click", async () => {
    vi.mocked(updaterService.checkAppUpdate).mockResolvedValueOnce({
      status: "available",
      info: {
        version: "0.2.0",
        currentVersion: "0.1.0",
        body: "Exciting new features!",
      },
    });
    vi.mocked(updaterService.downloadAndInstall).mockResolvedValueOnce({
      success: true,
    });

    render(<UpdateSettingsCard />);
    const checkBtn = screen.getByRole("button", { name: /Check for Updates/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText(/Version v0.2.0 is available!/i)).toBeDefined();
      expect(screen.getByText(/Exciting new features!/i)).toBeDefined();
    });

    const downloadBtn = screen.getByRole("button", { name: /Download & Install/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Restart to Apply/i })
      ).toBeDefined();
    });
  });

  it("displays error banner when update check fails", async () => {
    vi.mocked(updaterService.checkAppUpdate).mockResolvedValueOnce({
      status: "error",
      message: "Network request timed out",
    });

    render(<UpdateSettingsCard />);
    fireEvent.click(screen.getByRole("button", { name: /Check for Updates/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network request timed out/i)).toBeDefined();
    });
  });
});
