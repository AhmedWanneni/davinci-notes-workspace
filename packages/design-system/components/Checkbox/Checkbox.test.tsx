import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders unchecked by default", () => {
    const { getByRole } = render(<Checkbox aria-label="Accept terms" />);
    const checkbox = getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
  });

  it("can be checked initially", () => {
    const { getByRole } = render(
      <Checkbox defaultChecked aria-label="Accept terms" />,
    );
    const checkbox = getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
  });

  it("toggles when clicked", () => {
    const handleCheckedChange = vi.fn();
    const { getByRole } = render(
      <Checkbox
        onCheckedChange={handleCheckedChange}
        aria-label="Accept terms"
      />,
    );
    const checkbox = getByRole("checkbox", { name: "Accept terms" });

    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it("respects disabled state", () => {
    const handleCheckedChange = vi.fn();
    const { getByRole } = render(
      <Checkbox
        disabled
        onCheckedChange={handleCheckedChange}
        aria-label="Accept terms"
      />,
    );
    const checkbox = getByRole("checkbox", { name: "Accept terms" });

    expect(checkbox.hasAttribute("disabled")).toBe(true);
    fireEvent.click(checkbox);
    expect(handleCheckedChange).not.toHaveBeenCalled();
  });
});
