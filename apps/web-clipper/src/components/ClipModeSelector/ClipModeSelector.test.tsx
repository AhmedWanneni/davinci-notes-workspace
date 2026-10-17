import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClipModeSelector } from "./ClipModeSelector";

describe("ClipModeSelector", () => {
  it("offers all three clip modes", () => {
    render(<ClipModeSelector mode="full" onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: /Full page/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Selection/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Highlights/ })).not.toBeChecked();
  });

  it("reports the mode the user picks", () => {
    const onChange = vi.fn();
    render(<ClipModeSelector mode="full" onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: /Selection/ }));

    expect(onChange).toHaveBeenCalledWith("selection");
  });

  it("keeps unavailable modes visible, disabled, and says why", () => {
    render(
      <ClipModeSelector
        mode="full"
        onChange={() => {}}
        disabledModes={["selection", "highlights"]}
      />,
    );

    expect(screen.getByRole("radio", { name: /Selection/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Highlights/ })).toBeDisabled();
    expect(screen.getAllByText("Nothing to clip")).toHaveLength(2);
  });
});
