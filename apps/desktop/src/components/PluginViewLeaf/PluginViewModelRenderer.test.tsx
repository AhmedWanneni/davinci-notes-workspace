// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PluginViewModelRenderer } from "./PluginViewModelRenderer";

describe("PluginViewModelRenderer", () => {
  it("renders only trusted host elements and sends a structured event", () => {
    const onEvent = vi.fn();
    const { container } = render(<PluginViewModelRenderer
      model={{ type: "stack", children: [
        { type: "text", text: "<img src=x onerror=alert(1)>" },
        { type: "button", id: "increment", label: "Increment" },
      ] }}
      onEvent={onEvent}
    />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Increment" }));
    expect(onEvent).toHaveBeenCalledWith({ type: "click", targetId: "increment" });
  });
});
