import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogTrigger, DialogContent } from "./Dialog";

describe("Dialog", () => {
  it("does not render content initially", () => {
    render(
      <Dialog>
        <DialogContent title="Test Dialog">
          <div>Dialog body</div>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText("Test Dialog")).toBeNull();
  });

  // Radix portals can be difficult to test in some environments.
  // Focus on basic rendering interactions.
  it("renders content when open", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="Test Dialog">
          <div>Dialog body</div>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByText("Open");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Test Dialog")).toBeDefined();
      expect(screen.getByText("Dialog body")).toBeDefined();
    });
  });
});
