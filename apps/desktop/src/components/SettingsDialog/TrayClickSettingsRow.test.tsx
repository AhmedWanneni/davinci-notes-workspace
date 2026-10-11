// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { TrayClickSettingsRow } from "./TrayClickSettingsRow";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("TrayClickSettingsRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders select with capture and menu options when supported", async () => {
    vi.mocked(invoke).mockResolvedValueOnce({
      action: "capture",
      supported: true,
    });

    render(<TrayClickSettingsRow />);

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: /menu bar icon click action/i }),
      ).toBeDefined();
    });

    const select = screen.getByRole("combobox", {
      name: /menu bar icon click action/i,
    }) as HTMLSelectElement;
    expect(select.value).toBe("capture");
    expect(screen.getByText("Open quick capture")).toBeDefined();
    expect(screen.getByText("Open menu")).toBeDefined();
  });

  it("calls set_tray_click_action when selection changes", async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce({
        action: "capture",
        supported: true,
      })
      .mockResolvedValueOnce(undefined);

    render(<TrayClickSettingsRow />);

    const select = await screen.findByRole("combobox", {
      name: /menu bar icon click action/i,
    });

    fireEvent.change(select, { target: { value: "menu" } });

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("set_tray_click_action", {
        action: "menu",
      });
    });
  });

  it("renders null and hides setting when unsupported on the platform", async () => {
    vi.mocked(invoke).mockResolvedValueOnce({
      action: "capture",
      supported: false,
    });

    const { container } = render(<TrayClickSettingsRow />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
