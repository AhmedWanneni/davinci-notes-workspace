// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReminderEditModal } from "./ReminderEditModal";

describe("ReminderEditModal", () => {
  it("returns null when reminder is null", () => {
    const { container } = render(
      <ReminderEditModal reminder={null} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("dispatches token update and closes on confirm", () => {
    const dispatch = vi.fn();
    const onClose = vi.fn();

    const mockReminder = {
      from: 10,
      to: 28,
      date: "2026-10-20",
      time: "10:00",
      rawToken: "(@2026-10-20 10:00)",
      view: { dispatch } as unknown as import("@codemirror/view").EditorView,
    };

    render(<ReminderEditModal reminder={mockReminder} onClose={onClose} />);

    const saveBtn = screen.getByText("Save");
    fireEvent.click(saveBtn);

    expect(dispatch).toHaveBeenCalledWith({
      changes: {
        from: 10,
        to: 28,
        insert: "(@2026-10-20 10:00)",
      },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("dispatches empty string on delete", () => {
    const dispatch = vi.fn();
    const onClose = vi.fn();

    const mockReminder = {
      from: 5,
      to: 19,
      date: "2026-10-20",
      rawToken: "(@2026-10-20)",
      view: { dispatch } as unknown as import("@codemirror/view").EditorView,
    };

    render(<ReminderEditModal reminder={mockReminder} onClose={onClose} />);

    const removeBtn = screen.getByText("Remove");
    fireEvent.click(removeBtn);

    expect(dispatch).toHaveBeenCalledWith({
      changes: {
        from: 5,
        to: 19,
        insert: "",
      },
    });
    expect(onClose).toHaveBeenCalled();
  });
});
