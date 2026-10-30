// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsCard } from "./SettingsCard";

describe("SettingsCard", () => {
  it("renders title and children when content is present", () => {
    render(
      <SettingsCard title="Test Section" description="Test description">
        <div>Child content</div>
      </SettingsCard>,
    );

    expect(screen.getByText("Test Section")).toBeDefined();
    expect(screen.getByText("Test description")).toBeDefined();
    expect(screen.getByText("Child content")).toBeDefined();
  });

  it("does not render when children is empty or falsy", () => {
    const { container } = render(
      <SettingsCard title="Empty Section">{null}</SettingsCard>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when children is an array of nulls/booleans", () => {
    const { container } = render(
      <SettingsCard title="Empty Section">
        {false}
        {undefined}
      </SettingsCard>,
    );
    expect(container.firstChild).toBeNull();
  });
});
