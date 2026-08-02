import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Typography } from "./Typography";

describe("Typography", () => {
  it("renders default text correctly", () => {
    const { getByText } = render(<Typography>Hello</Typography>);
    const el = getByText("Hello");
    expect(el.tagName).toBe("SPAN");
    expect(el.className).toContain("text");
  });

  it("renders headings with correct tags by default", () => {
    const { getByText } = render(
      <Typography variant="h1">Heading 1</Typography>,
    );
    const el = getByText("Heading 1");
    expect(el.tagName).toBe("H1");
    expect(el.className).toContain("heading--h1");
  });

  it('allows overriding the underlying element with the "as" prop', () => {
    const { getByText } = render(
      <Typography as="p" variant="h2">
        Paragraph Heading
      </Typography>,
    );
    const el = getByText("Paragraph Heading");
    expect(el.tagName).toBe("P");
    expect(el.className).toContain("heading--h2");
  });

  it("applies color, size, and weight classes correctly", () => {
    const { getByText } = render(
      <Typography color="accent" size="lg" weight="bold">
        Styled Text
      </Typography>,
    );
    const el = getByText("Styled Text");
    expect(el.className).toContain("text--accent");
    expect(el.className).toContain("text--lg");
    expect(el.className).toContain("text--bold");
  });

  it("works as a Radix Slot when asChild is true", () => {
    const { getByText } = render(
      <Typography asChild color="error">
        <a href="#link">Slot Link</a>
      </Typography>,
    );
    const el = getByText("Slot Link");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("#link");
    expect(el.className).toContain("text--error");
  });
});
