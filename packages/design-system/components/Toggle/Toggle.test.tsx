import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("renders unchecked by default", () => {
    const { getByRole } = render(<Toggle aria-label="Setting" />);
    const toggle = getByRole("switch", { name: "Setting" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("can be checked initially", () => {
    const { getByRole } = render(
      <Toggle defaultChecked aria-label="Setting" />,
    );
    const toggle = getByRole("switch", { name: "Setting" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("toggles when clicked", () => {
    const handleCheckedChange = vi.fn();
    const { getByRole } = render(
      <Toggle onCheckedChange={handleCheckedChange} aria-label="Setting" />,
    );
    const toggle = getByRole("switch", { name: "Setting" });

    fireEvent.click(toggle);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it("respects disabled state", () => {
    const handleCheckedChange = vi.fn();
    const { getByRole } = render(
      <Toggle
        disabled
        onCheckedChange={handleCheckedChange}
        aria-label="Setting"
      />,
    );
    const toggle = getByRole("switch", { name: "Setting" });

    expect(toggle.hasAttribute("disabled")).toBe(true);
    fireEvent.click(toggle);
    expect(handleCheckedChange).not.toHaveBeenCalled();
  });
});
