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

  it("prevents outside pointer dismiss when interacting with reminder toast", async () => {
    const onOpenChange = vi.fn();
    const onPointerDownOutside = vi.fn();

    render(
      <div>
        <div data-reminder-toast="true">
          <button id="toast-done-btn">Done</button>
        </div>
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent
            title="Test Dialog"
            onPointerDownOutside={onPointerDownOutside}
          >
            <div>Dialog body</div>
          </DialogContent>
        </Dialog>
      </div>,
    );

    const toastBtn = document.getElementById("toast-done-btn");
    expect(toastBtn).not.toBeNull();

    // Clicking toast button should not trigger onPointerDownOutside custom handler
    // nor close the dialog because of default prevention on toast targets
    if (toastBtn) {
      toastBtn.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true }),
      );
    }

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onPointerDownOutside).not.toHaveBeenCalled();
  });
});
