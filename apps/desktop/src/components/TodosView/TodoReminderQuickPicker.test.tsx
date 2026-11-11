// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoReminderQuickPicker } from "./TodoReminderQuickPicker";

describe("TodoReminderQuickPicker", () => {
  it("renders presets when open and selects Tomorrow", () => {
    const onSetReminder = vi.fn();
    const onClose = vi.fn();

    render(
      <TodoReminderQuickPicker
        isOpen={true}
        onClose={onClose}
        onSetReminder={onSetReminder}
        hasReminder={false}
      />,
    );

    expect(screen.getByText("Today (5:00 PM)")).toBeDefined();
    expect(screen.getByText("Tomorrow (9:00 AM)")).toBeDefined();
    expect(screen.getByText("Next Week")).toBeDefined();

    fireEvent.click(screen.getByText("Tomorrow (9:00 AM)"));
    expect(onSetReminder).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows remove reminder button when hasReminder is true", () => {
    const onSetReminder = vi.fn();
    const onClose = vi.fn();

    render(
      <TodoReminderQuickPicker
        isOpen={true}
        onClose={onClose}
        onSetReminder={onSetReminder}
        hasReminder={true}
      />,
    );

    const removeBtn = screen.getByText("Remove reminder");
    fireEvent.click(removeBtn);
    expect(onSetReminder).toHaveBeenCalledWith("");
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null when isOpen is false", () => {
    const { container } = render(
      <TodoReminderQuickPicker
        isOpen={false}
        onClose={vi.fn()}
        onSetReminder={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
