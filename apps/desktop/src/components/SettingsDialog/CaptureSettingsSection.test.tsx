// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { CaptureSettingsSection } from "./CaptureSettingsSection";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("CaptureSettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (invoke as ReturnType<typeof vi.fn>).mockImplementation((cmd: string) => {
      if (cmd === "get_capture_shortcut") {
        return Promise.resolve("Control+Alt+N");
      }
      if (cmd === "get_capture_target") {
        return Promise.resolve("Inbox.md");
      }
      return Promise.resolve();
    });
  });

  it("loads and displays saved shortcut and target note", async () => {
    render(<CaptureSettingsSection />);

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: /quick capture shortcut/i }),
      ).toBeDefined();
      expect(
        screen.getByRole("textbox", { name: /quick capture target note/i }),
      ).toBeDefined();
    });

    const shortcutInput = screen.getByRole("textbox", {
      name: /quick capture shortcut/i,
    }) as HTMLInputElement;
    const targetInput = screen.getByRole("textbox", {
      name: /quick capture target note/i,
    }) as HTMLInputElement;

    expect(shortcutInput.value).toBe("Control+Alt+N");
    expect(targetInput.value).toBe("Inbox.md");
  });

  it("invokes set_capture_shortcut on blur", async () => {
    render(<CaptureSettingsSection />);

    const shortcutInput = screen.getByRole("textbox", {
      name: /quick capture shortcut/i,
    });
    fireEvent.change(shortcutInput, { target: { value: "Control+Shift+J" } });
    fireEvent.blur(shortcutInput);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("set_capture_shortcut", {
        shortcut: "Control+Shift+J",
      });
    });
  });

  it("displays error message when shortcut validation fails", async () => {
    (invoke as ReturnType<typeof vi.fn>).mockImplementation((cmd: string) => {
      if (cmd === "set_capture_shortcut") {
        return Promise.reject("Invalid shortcut format");
      }
      return Promise.resolve();
    });

    render(<CaptureSettingsSection />);

    const shortcutInput = screen.getByRole("textbox", {
      name: /quick capture shortcut/i,
    });
    fireEvent.change(shortcutInput, { target: { value: "InvalidCombo" } });
    fireEvent.blur(shortcutInput);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText("Invalid shortcut format")).toBeDefined();
    });
  });

  it("invokes set_capture_target on blur", async () => {
    render(<CaptureSettingsSection />);

    const targetInput = screen.getByRole("textbox", {
      name: /quick capture target note/i,
    });
    fireEvent.change(targetInput, { target: { value: "Daily/Quick.md" } });
    fireEvent.blur(targetInput);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("set_capture_target", {
        target: "Daily/Quick.md",
      });
    });
  });
});
