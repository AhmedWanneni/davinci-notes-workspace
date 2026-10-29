// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OwlIcon } from "./OwlIcon";

describe("OwlIcon", () => {
  it("renders with dark variant by default", () => {
    render(<OwlIcon />);
    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("/logo/dark-logo.svg");
    expect(img.getAttribute("width")).toBe("18");
    expect(img.getAttribute("height")).toBe("18");
  });

  it("renders with light variant when requested", () => {
    render(<OwlIcon variant="light" size={24} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("/logo/light.logo.svg");
    expect(img.getAttribute("width")).toBe("24");
    expect(img.getAttribute("height")).toBe("24");
  });
});
