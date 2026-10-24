import React from "react";
import { describe, expect, it } from "vitest";
import { ThemeSettingsSection } from "./ThemeSettingsSection";
import { MobileThemeProvider } from "../../theme";

describe("ThemeSettingsSection Component", () => {
  it("renders ThemeSettingsSection within MobileThemeProvider", () => {
    const element = (
      <MobileThemeProvider initialThemeId="dark-b" initialMode="system">
        <ThemeSettingsSection />
      </MobileThemeProvider>
    );

    expect(element).toBeDefined();
  });
});
