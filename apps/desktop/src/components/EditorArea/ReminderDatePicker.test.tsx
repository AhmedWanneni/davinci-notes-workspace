// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReminderDatePicker } from "./ReminderDatePicker";

describe("ReminderDatePicker", () => {
  it("renders with default/initial values and quick presets", () => {
    render(
      <ReminderDatePicker
        initialDate="2026-10-20"
        initialTime="14:30"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dateInput = screen.getByLabelText("Date") as HTMLInputElement;
    const timeInput = screen.getByLabelText("Time") as HTMLInputElement;

    expect(dateInput.value).toBe("2026-10-20");
    expect(timeInput.value).toBe("14:30");
    expect(screen.getByText("Later today")).not.toBeNull();
    expect(screen.getByText("Tomorrow (9 AM)")).not.toBeNull();
    expect(screen.getByText("Next week")).not.toBeNull();
  });

  it("updates inputs when quick presets are clicked", () => {
    render(<ReminderDatePicker onConfirm={vi.fn()} onCancel={vi.fn()} />);

    const tomorrowBtn = screen.getByText("Tomorrow (9 AM)");
    fireEvent.click(tomorrowBtn);

    const timeInput = screen.getByLabelText("Time") as HTMLInputElement;
    expect(timeInput.value).toBe("09:00");
  });

  it("calls onConfirm with date and time when submitted", () => {
    const onConfirm = vi.fn();
    render(
      <ReminderDatePicker
        initialDate="2026-10-25"
        initialTime="16:00"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    const insertBtn = screen.getByText("Insert");
    fireEvent.click(insertBtn);

    expect(onConfirm).toHaveBeenCalledWith({
      date: "2026-10-25",
      time: "16:00",
    });
  });

  it("omits time when 'All day' is checked", () => {
    const onConfirm = vi.fn();
    render(
      <ReminderDatePicker
        initialDate="2026-10-25"
        initialTime="16:00"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    const allDayCheckbox = screen.getByLabelText(/All day/i);
    fireEvent.click(allDayCheckbox);

    const insertBtn = screen.getByText("Insert");
    fireEvent.click(insertBtn);

    expect(onConfirm).toHaveBeenCalledWith({
      date: "2026-10-25",
      time: undefined,
    });
  });

  it("renders Remove button in editing mode and calls onDelete", () => {
    const onDelete = vi.fn();
    render(
      <ReminderDatePicker
        initialDate="2026-10-20"
        isEditing={true}
        onConfirm={vi.fn()}
        onDelete={onDelete}
        onCancel={vi.fn()}
      />,
    );

    const removeBtn = screen.getByText("Remove");
    expect(removeBtn).not.toBeNull();
    fireEvent.click(removeBtn);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
