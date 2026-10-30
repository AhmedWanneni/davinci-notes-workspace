// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickCaptureReminder } from "./QuickCaptureReminder";

describe("QuickCaptureReminder", () => {
  it("renders reminder inputs and handles preset buttons", () => {
    const onSave = vi.fn();
    const onDismiss = vi.fn();
    const onFolderChange = vi.fn();

    render(
      <QuickCaptureReminder
        onSaveReminder={onSave}
        onDismiss={onDismiss}
        folder=""
        onFolderChange={onFolderChange}
      />,
    );

    expect(screen.getByRole("region", { name: "Quick reminder section" })).toBeDefined();
    expect(screen.getByLabelText("Reminder task text")).toBeDefined();
    expect(screen.getByLabelText("Due date")).toBeDefined();
    expect(screen.getByLabelText("Due time")).toBeDefined();
    expect(screen.getByRole("button", { name: "Tomorrow" })).toBeDefined();

    // Click Tomorrow preset
    fireEvent.click(screen.getByRole("button", { name: "Tomorrow" }));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    const expected = `${year}-${month}-${day}`;
    expect((screen.getByLabelText("Due date") as HTMLInputElement).value).toBe(expected);
  });

  it("submits formatted reminder task on clicking Save reminder", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDismiss = vi.fn();
    const onFolderChange = vi.fn();

    render(
      <QuickCaptureReminder
        onSaveReminder={onSave}
        onDismiss={onDismiss}
        folder="Work"
        onFolderChange={onFolderChange}
      />,
    );

    const taskInput = screen.getByLabelText("Reminder task text");
    fireEvent.change(taskInput, { target: { value: "Submit tax report" } });

    const saveBtn = screen.getByRole("button", { name: "Save reminder" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.stringMatching(/- \[ \] Submit tax report \(@\d{4}-\d{2}-\d{2}/),
        "Reminders.md",
        "Work",
      );
    });
  });

  it("triggers onDismiss on clicking Cancel", () => {
    const onDismiss = vi.fn();
    render(
      <QuickCaptureReminder
        onSaveReminder={vi.fn()}
        onDismiss={onDismiss}
        folder=""
        onFolderChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
