import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HighlighterPanel } from "./HighlighterPanel";

describe("HighlighterPanel", () => {
  it("explains that broad page access is opt-in", () => {
    render(
      <HighlighterPanel
        controller={{
          loading: false,
          enabled: false,
          changing: false,
          setEnabled: vi.fn(),
        }}
      />,
    );
    expect(
      screen.getByLabelText("Restore highlights on pages"),
    ).not.toBeChecked();
    expect(screen.getByText(/Enable page access/u)).toBeInTheDocument();
  });

  it("reports a permission error", () => {
    render(
      <HighlighterPanel
        controller={{
          loading: false,
          enabled: false,
          changing: false,
          error: "Denied",
          setEnabled: vi.fn(),
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Denied");
  });
});
