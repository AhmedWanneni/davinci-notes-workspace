import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PairingSettingsController } from "../../pairing/usePairingSettings";
import { PairingPanel } from "./PairingPanel";

function controller(
  overrides: Partial<PairingSettingsController> = {},
): PairingSettingsController {
  return {
    loading: false,
    paired: false,
    port: "47912",
    token: "",
    saving: false,
    setPort: vi.fn(),
    setToken: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

describe("PairingPanel", () => {
  it("shows where to find the port and token, and the stored values", () => {
    render(
      <PairingPanel
        controller={controller({
          paired: true,
          port: "51234",
          token: "abc123",
        })}
      />,
    );

    expect(screen.getByText("Web Clipper")).toBeInTheDocument();
    expect(screen.getByText(/Settings, then Web Clipper/)).toBeInTheDocument();
    expect(screen.getByLabelText("Port")).toHaveValue("51234");
    expect(screen.getByLabelText("Pairing token")).toHaveValue("abc123");
  });

  it("routes each field edit to its own handler", () => {
    const setPort = vi.fn();
    const setToken = vi.fn();
    render(<PairingPanel controller={controller({ setPort, setToken })} />);

    fireEvent.change(screen.getByLabelText("Port"), {
      target: { value: "51234" },
    });
    fireEvent.change(screen.getByLabelText("Pairing token"), {
      target: { value: "abc123" },
    });

    expect(setPort).toHaveBeenCalledWith("51234");
    expect(setToken).toHaveBeenCalledWith("abc123");
  });

  it("saves on submit, so Enter works from either field", () => {
    const save = vi.fn();
    render(<PairingPanel controller={controller({ save })} />);

    fireEvent.submit(screen.getByRole("button", { name: "Save pairing" }));

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("offers to forget only a pairing that exists", () => {
    const clear = vi.fn();
    const { rerender } = render(
      <PairingPanel controller={controller({ clear })} />,
    );
    expect(
      screen.getByRole("button", { name: "Forget pairing" }),
    ).toBeDisabled();

    rerender(<PairingPanel controller={controller({ paired: true, clear })} />);
    fireEvent.click(screen.getByRole("button", { name: "Forget pairing" }));

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("shows field errors and a storage failure", () => {
    render(
      <PairingPanel
        controller={controller({
          port: "70000",
          portError: "Enter the port DaVinci Notes shows, for example 47912.",
          tokenError: "Paste the pairing token from DaVinci Notes.",
          error: "The pairing could not be saved. Try again.",
        })}
      />,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.getByText(/Enter the port/)).toBeInTheDocument();
    expect(screen.getByText(/Paste the pairing token/)).toBeInTheDocument();
    expect(screen.getByText(/could not be saved/)).toBeInTheDocument();
  });

  it("shows the confirmation of the last save", () => {
    render(
      <PairingPanel
        controller={controller({
          paired: true,
          token: "abc123",
          notice: "Pairing saved. Clips now go straight to your vault.",
        })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Pairing saved.");
  });

  it("reads the stored pairing before showing the form", () => {
    render(<PairingPanel controller={controller({ loading: true })} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Reading the saved pairing…",
    );
    expect(screen.queryByLabelText("Port")).toBeNull();
  });

  it("blocks a second save while one is in flight", () => {
    render(<PairingPanel controller={controller({ saving: true })} />);

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Forget pairing" }),
    ).toBeDisabled();
  });
});
