import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders correctly with default variant", () => {
    const { getByText } = render(<Badge>Label</Badge>);
    const badge = getByText("Label");
    expect(badge.className).toContain("badge--neutral");
  });

  it("renders different variants", () => {
    const { getByText } = render(<Badge variant="accent">Accent</Badge>);
    const badge = getByText("Accent");
    expect(badge.className).toContain("badge--accent");
  });

  it("renders with an icon", () => {
    const { getByText, container } = render(
      <Badge icon={<span data-testid="icon">Icon</span>}>Label</Badge>,
    );

    expect(getByText("Label")).toBeDefined();
    expect(container.querySelector('[data-testid="icon"]')).toBeDefined();
  });
});
