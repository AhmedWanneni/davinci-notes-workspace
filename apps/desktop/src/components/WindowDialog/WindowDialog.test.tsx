// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WindowDialog } from "./WindowDialog";

describe("WindowDialog", () => {
  it("renders when open and displays title and content", () => {
    render(
      <WindowDialog isOpen={true} onClose={vi.fn()} title="Test Dialog">
        <div>Dialog Body Content</div>
      </WindowDialog>,
    );

    expect(screen.getByText("Test Dialog")).toBeDefined();
    expect(screen.getByText("Dialog Body Content")).toBeDefined();
  });

  it("does not render when isOpen is false", () => {
    render(
      <WindowDialog isOpen={false} onClose={vi.fn()} title="Test Dialog">
        <div>Dialog Body Content</div>
      </WindowDialog>,
    );

    expect(screen.queryByText("Test Dialog")).toBeNull();
  });

  it("calls onClose when traffic light close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <WindowDialog isOpen={true} onClose={onClose} title="Test Dialog">
        <div>Content</div>
      </WindowDialog>,
    );

    const closeBtn = screen.getByLabelText("Close dialog");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders custom headerRight and footer when provided", () => {
    render(
      <WindowDialog
        isOpen={true}
        onClose={vi.fn()}
        title="Custom Extras"
        headerRight={<button>Action</button>}
        footer={<button>Confirm</button>}
      >
        <div>Content</div>
      </WindowDialog>,
    );

    expect(screen.getByText("Action")).toBeDefined();
    expect(screen.getByText("Confirm")).toBeDefined();
  });
});
