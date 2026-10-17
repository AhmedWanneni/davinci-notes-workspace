// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SettingsDialog } from "./SettingsDialog";

describe("SettingsDialog", () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    vaultPath: "/path/to/Obsidian Vault",
    onVaultSwitched: vi.fn(),
    themes: [
      {
        id: "theme-1",
        dirName: "theme-1",
        manifest: {
          id: "theme-1",
          name: "Tokyo Night",
          version: "1.0.0",
          author: "Davinci",
          minAppVersion: "0.1.0",
          description: "A clean dark theme",
          styles: "theme.css",
        },
      },
    ],
    activeThemeId: null,
    themeDiscoveryErrors: [],
    onActivateTheme: vi.fn(),
    themeManager: null,
    onReloadThemes: vi.fn().mockResolvedValue(undefined),
    onActivateThemeFromBrowser: vi.fn().mockResolvedValue(undefined),
  };

  it("renders the dialog with header and sidebar", () => {
    render(<SettingsDialog {...defaultProps} />);

    expect(
      screen.getByText(/Settings - Obsidian Vault - Davinci Notes 0.1.0/i),
    ).toBeDefined();
    expect(screen.getByPlaceholderText(/Search settings/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "General" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Appearance" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Editor" })).toBeDefined();
  });

  it("renders general tab content by default", () => {
    render(<SettingsDialog {...defaultProps} />);

    expect(screen.getByText(/Version 0.1.0/i)).toBeDefined();
    expect(screen.getByText(/Keep running in menu bar/i)).toBeDefined();
    expect(screen.getByText(/Automatic updates/i)).toBeDefined();
    expect(screen.getByText(/Receive early access versions/i)).toBeDefined();
    expect(screen.getByText(/Your account/i)).toBeDefined();
  });

  it("navigates to editor tab when clicked", () => {
    render(<SettingsDialog {...defaultProps} />);

    const editorBtn = screen.getByRole("button", { name: "Editor" });
    fireEvent.click(editorBtn);

    expect(screen.getByText("Editor Font")).toBeDefined();
    expect(screen.getByText("Editor Font Size")).toBeDefined();
    expect(screen.getByText("Strict Line Breaks")).toBeDefined();
  });

  it("navigates to appearance tab when clicked", () => {
    render(<SettingsDialog {...defaultProps} />);

    const appearanceBtn = screen.getByRole("button", { name: "Appearance" });
    fireEvent.click(appearanceBtn);

    expect(screen.getByText("Current Theme")).toBeDefined();
  });

  it("filters sidebar navigation by search query", () => {
    render(<SettingsDialog {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search settings/i);
    fireEvent.change(searchInput, { target: { value: "Editor" } });

    expect(screen.getByRole("button", { name: "Editor" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "General" })).toBeNull();
  });

  it("calls onOpenChange(false) when close traffic light dot is clicked", () => {
    const onOpenChange = vi.fn();
    render(<SettingsDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const closeBtn = screen.getByLabelText(/Close settings/i);
    fireEvent.click(closeBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("navigates to logs tab when clicked and displays logs", () => {
    const logs = [
      "2026-10-12 12:00:00 [info] Vault indexed",
      "2026-10-12 12:00:01 [info] Ready",
    ];
    render(<SettingsDialog {...defaultProps} log={logs} />);

    const logsBtn = screen.getByRole("button", { name: "Logs" });
    fireEvent.click(logsBtn);

    expect(screen.getByText("Vault Activity Logs")).toBeDefined();
    expect(screen.getByText(/Vault indexed/)).toBeDefined();
    expect(screen.getByText(/Ready/)).toBeDefined();
  });

  it("renders logs tab directly when initialTab is 'logs'", () => {
    render(
      <SettingsDialog
        {...defaultProps}
        initialTab="logs"
        log={["Single log entry"]}
      />,
    );

    expect(screen.getByText("Vault Activity Logs")).toBeDefined();
    expect(screen.getByText("Single log entry")).toBeDefined();
  });
});
