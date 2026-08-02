import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders a horizontal divider by default", () => {
    const { getByRole } = render(<Divider />);
    const separator = getByRole("separator");
    expect(separator).toBeDefined();
    expect(separator.className).toContain("divider--horizontal");
    expect(separator.className).toContain("divider--normal");
  });

  it("renders a vertical divider", () => {
    const { getByRole } = render(<Divider orientation="vertical" />);
    const separator = getByRole("separator");
    expect(separator.getAttribute("aria-orientation")).toBe("vertical");
    expect(separator.className).toContain("divider--vertical");
  });

  it("renders strong variant", () => {
    const { getByRole } = render(<Divider variant="strong" />);
    const separator = getByRole("separator");
    expect(separator.className).toContain("divider--strong");
  });
});
