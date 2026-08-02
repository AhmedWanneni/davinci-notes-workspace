import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a primary button by default", () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const button = getByRole("button", { name: "Click me" });
    expect(button.className).toContain("button--primary");
    expect(button.className).toContain("button--md");
  });

  it("renders different variants and sizes", () => {
    const { getByRole } = render(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    );
    const button = getByRole("button", { name: "Delete" });
    expect(button.className).toContain("button--danger");
    expect(button.className).toContain("button--lg");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    const { getByRole } = render(
      <Button onClick={handleClick}>Click me</Button>,
    );
    const button = getByRole("button", { name: "Click me" });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    const handleClick = vi.fn();
    const { getByRole } = render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    const button = getByRole("button", { name: "Disabled" });

    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders as a Radix Slot when asChild is true", () => {
    const { getByRole } = render(
      <Button asChild variant="secondary">
        <a href="https://example.com">Link Button</a>
      </Button>,
    );
    const link = getByRole("link", { name: "Link Button" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.className).toContain("button--secondary");
  });
});
