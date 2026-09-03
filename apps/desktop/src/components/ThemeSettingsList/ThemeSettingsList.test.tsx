// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ThemeRecord } from "../../themes";
import { ThemeSettingsList } from "./ThemeSettingsList";

const themes: ThemeRecord[] = [
  {
    id: "theme-a",
    dirName: "theme-a",
    manifest: {
      id: "theme-a",
      name: "Theme A",
      version: "1.0.0",
      minAppVersion: "0.1.0",
      author: "Test Author",
      description: "A fixture theme",
      styles: "styles.css",
    },
  },
];

describe("ThemeSettingsList", () => {
  it("shows installed themes and activates the selected theme", () => {
    const onActivate = vi.fn();
    render(
      <ThemeSettingsList
        themes={themes}
        activeThemeId={null}
        onActivate={onActivate}
      />,
    );

    expect(screen.getAllByText("Theme A")).toHaveLength(2);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "theme-a" },
    });

    expect(onActivate).toHaveBeenCalledWith("theme-a");
  });

  it("reports malformed theme folders without hiding valid themes", () => {
    render(
      <ThemeSettingsList
        themes={themes}
        activeThemeId="theme-a"
        discoveryErrors={[{ dirName: "broken", error: "invalid manifest" }]}
        onActivate={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Theme A")).toHaveLength(2);
    expect(screen.getByText("Skipped broken: invalid manifest")).toBeTruthy();
  });
});
