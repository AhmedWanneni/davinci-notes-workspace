import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip, TooltipProvider } from "./Tooltip";

describe("Tooltip", () => {
  it("renders children correctly", () => {
    const { getByRole } = render(
      <TooltipProvider>
        <Tooltip content="Tooltip content">
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(getByRole("button", { name: "Hover me" })).toBeDefined();
  });

  // Radix UI tooltips can be tricky to test because they use Portals and delays.
  // This is a basic test. In a real project, more robust testing for popovers might be needed.
  it("shows tooltip content on hover", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip content="Test Tooltip" delayDuration={0}>
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Hover me" });

    // Content should not be visible initially
    expect(screen.queryByText("Test Tooltip")).toBeNull();

    // Hover the trigger
    await user.hover(trigger);

    // Wait for tooltip content to appear in the portal
    await waitFor(() => {
      const tooltipContent = screen.getByText("Test Tooltip");
      expect(tooltipContent).toBeDefined();
    });
  });
});
