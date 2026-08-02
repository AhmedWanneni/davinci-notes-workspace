import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RadioGroup, RadioGroupItem } from "./Radio";

describe("RadioGroup", () => {
  it("renders correctly", () => {
    const { getByRole } = render(
      <RadioGroup aria-label="Options">
        <RadioGroupItem value="1" aria-label="Option 1" />
        <RadioGroupItem value="2" aria-label="Option 2" />
      </RadioGroup>,
    );

    expect(getByRole("radiogroup", { name: "Options" })).toBeDefined();
    expect(getByRole("radio", { name: "Option 1" })).toBeDefined();
    expect(getByRole("radio", { name: "Option 2" })).toBeDefined();
  });

  it("handles value changes", () => {
    const handleValueChange = vi.fn();
    const { getByRole } = render(
      <RadioGroup onValueChange={handleValueChange}>
        <RadioGroupItem value="1" aria-label="Option 1" />
        <RadioGroupItem value="2" aria-label="Option 2" />
      </RadioGroup>,
    );

    const option2 = getByRole("radio", { name: "Option 2" });
    fireEvent.click(option2);

    expect(handleValueChange).toHaveBeenCalledWith("2");
  });

  it("can be disabled", () => {
    const handleValueChange = vi.fn();
    const { getByRole } = render(
      <RadioGroup disabled onValueChange={handleValueChange}>
        <RadioGroupItem value="1" aria-label="Option 1" />
      </RadioGroup>,
    );

    const option1 = getByRole("radio", { name: "Option 1" });
    expect(option1.hasAttribute("disabled")).toBe(true);

    fireEvent.click(option1);
    expect(handleValueChange).not.toHaveBeenCalled();
  });
});
