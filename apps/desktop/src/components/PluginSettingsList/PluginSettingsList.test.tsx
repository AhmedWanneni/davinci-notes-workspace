// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PluginRecord } from "@app/plugin-runtime";
import { PluginSettingsList } from "./PluginSettingsList.js";

describe("PluginSettingsList", () => {
  const mockPlugins: PluginRecord[] = [
    {
      id: "calendar-view",
      manifest: {
        id: "calendar-view",
        name: "Calendar View",
        version: "1.2.0",
        minAppVersion: "0.1.0",
        description: "Visual calendar view",
        author: "DaVinci Team",
        main: "main.js",
      },
      dirName: "calendar-view",
      status: "enabled",
      instance: null,
    },
    {
      id: "broken-plugin",
      manifest: {
        id: "broken-plugin",
        name: "Broken Plugin",
        version: "0.5.0",
        minAppVersion: "0.1.0",
        description: "Fails on load",
        author: "Buggy",
        main: "main.js",
      },
      dirName: "broken-plugin",
      status: "error",
      error: "onload() failed: Network timeout",
      instance: null,
    },
    {
      id: "disabled-plugin",
      manifest: {
        id: "disabled-plugin",
        name: "Disabled Plugin",
        version: "1.0.0",
        minAppVersion: "0.1.0",
        description: "Inactive plugin",
        author: "Tester",
        main: "main.js",
      },
      dirName: "disabled-plugin",
      status: "disabled",
      instance: null,
    },
  ];

  it("renders empty state message when plugin list is empty", () => {
    render(<PluginSettingsList plugins={[]} onTogglePlugin={vi.fn()} />);
    expect(screen.getByText(/No plugins found in/i)).toBeDefined();
  });

  it("renders installed plugins with metadata", () => {
    render(
      <PluginSettingsList plugins={mockPlugins} onTogglePlugin={vi.fn()} />,
    );

    expect(screen.getByText("Calendar View")).toBeDefined();
    expect(screen.getByText("v1.2.0")).toBeDefined();
    expect(screen.getByText("by DaVinci Team")).toBeDefined();
    expect(screen.getByText("Visual calendar view")).toBeDefined();
    expect(screen.getByText("ID: calendar-view")).toBeDefined();

    expect(screen.getByText("Broken Plugin")).toBeDefined();
    expect(
      screen.getByText(/Error: onload\(\) failed: Network timeout/i),
    ).toBeDefined();
  });

  it("triggers onTogglePlugin when enable/disable checkbox is clicked", () => {
    const handleToggle = vi.fn();
    render(
      <PluginSettingsList
        plugins={mockPlugins}
        onTogglePlugin={handleToggle}
      />,
    );

    const disabledCheckbox = screen.getByLabelText("Enable Disabled Plugin");
    fireEvent.click(disabledCheckbox);
    expect(handleToggle).toHaveBeenCalledWith("disabled-plugin", true);

    const enabledCheckbox = screen.getByLabelText("Enable Calendar View");
    fireEvent.click(enabledCheckbox);
    expect(handleToggle).toHaveBeenCalledWith("calendar-view", false);
  });
});
