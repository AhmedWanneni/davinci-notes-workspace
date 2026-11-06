// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncthingLocalDeviceCard } from "./SyncthingLocalDeviceCard";
import * as commands from "./syncthingCommands";

describe("SyncthingLocalDeviceCard", () => {
  it("shows device settings beside Copy ID and updates auto-start", () => {
    const setAutoStart = vi.fn();
    render(<SyncthingLocalDeviceCard deviceId="DEVICE-ID" deviceName="Office Mac" autoStart={false} setAutoStart={setAutoStart} onUpdated={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.queryByText("Office Mac")).toBeNull();
    expect(screen.queryByText(/Start sync automatically/)).toBeNull();
    const buttons = screen.getAllByRole("button");
    expect(buttons[0].getAttribute("aria-label")).toBe("Copy Device ID");
    expect(buttons[1].getAttribute("aria-label")).toBe("Computer settings");
    fireEvent.click(screen.getByRole("button", { name: "Computer settings" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect((screen.getByRole("textbox", { name: "Computer name" }) as HTMLInputElement).value).toBe("Office Mac");
    fireEvent.click(screen.getByRole("checkbox", { name: /Start sync automatically/ }));
    expect(setAutoStart).toHaveBeenCalledWith(true);
  });

  it("lets the user rename this computer in its settings", async () => {
    vi.spyOn(commands, "syncthingSetLocalDeviceName").mockResolvedValue(undefined);
    const onUpdated = vi.fn().mockResolvedValue(undefined);
    render(<SyncthingLocalDeviceCard deviceId="DEVICE-ID" deviceName="Office Mac" autoStart={false} setAutoStart={vi.fn()} onUpdated={onUpdated} />);
    fireEvent.click(screen.getByRole("button", { name: "Computer settings" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "Computer name" }), { target: { value: "Studio Mac" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(commands.syncthingSetLocalDeviceName).toHaveBeenCalledWith("Studio Mac");
      expect(onUpdated).toHaveBeenCalled();
    });
  });
});
