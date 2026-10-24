// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { ClipperSettingsSection } from "./ClipperSettingsSection";
import type { ClipperStatus } from "./ClipperSettingsSection";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

const invokeMock = invoke as unknown as ReturnType<typeof vi.fn>;

function status(overrides: Partial<ClipperStatus> = {}): ClipperStatus {
  return {
    enabled: false,
    port: null,
    paired: false,
    defaultPort: 47912,
    ...overrides,
  };
}

function answer(handlers: Record<string, () => unknown>) {
  invokeMock.mockImplementation((command: string) => {
    const handler = handlers[command];
    if (!handler) return Promise.resolve(undefined);
    try {
      return Promise.resolve(handler());
    } catch (error) {
      return Promise.reject(error);
    }
  });
}

describe("ClipperSettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    answer({ clipper_status: () => status() });
  });

  it("shows the disabled state before the listener is bound", async () => {
    render(<ClipperSettingsSection />);

    const toggle = await screen.findByRole("switch", {
      name: /enable the web clipper/i,
    });
    await waitFor(() =>
      expect(toggle.getAttribute("aria-checked")).toBe("false"),
    );
    expect(screen.getByText("Disabled")).toBeDefined();
  });

  it("enables the clipper and reports the bound port", async () => {
    answer({
      clipper_status: () => status(),
      clipper_enable: () =>
        status({ enabled: true, port: 47912, paired: true }),
    });

    render(<ClipperSettingsSection />);
    const toggle = await screen.findByRole("switch", {
      name: /enable the web clipper/i,
    });
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith("clipper_enable"),
    );
    expect(
      await screen.findByText("Listening on 127.0.0.1:47912"),
    ).toBeDefined();
  });

  it("reveals the token only when asked, then copies it", async () => {
    answer({
      clipper_status: () =>
        status({ enabled: true, port: 47912, paired: true }),
      clipper_reveal_token: () => "pair-token-value",
    });

    render(<ClipperSettingsSection />);
    expect(
      await screen.findByRole("button", { name: /show token/i }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /show token/i }));

    const shown = (await screen.findByLabelText(
      /pairing token/i,
    )) as HTMLInputElement;
    expect(shown.value).toBe("pair-token-value");

    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "pair-token-value",
      ),
    );
    expect(await screen.findByText("Copied")).toBeDefined();
  });

  it("replaces the shown token on rotate", async () => {
    answer({
      clipper_status: () =>
        status({ enabled: true, port: 47912, paired: true }),
      clipper_reveal_token: () => "first-token",
      clipper_rotate_token: () => "second-token",
    });

    render(<ClipperSettingsSection />);
    fireEvent.click(await screen.findByRole("button", { name: /show token/i }));
    expect(
      ((await screen.findByLabelText(/pairing token/i)) as HTMLInputElement)
        .value,
    ).toBe("first-token");

    fireEvent.click(screen.getByRole("button", { name: /rotate/i }));

    await waitFor(() =>
      expect(
        (screen.getByLabelText(/pairing token/i) as HTMLInputElement).value,
      ).toBe("second-token"),
    );
  });

  it("forgets the token and stops listening on revoke", async () => {
    answer({
      clipper_status: () =>
        status({ enabled: true, port: 47912, paired: true }),
      clipper_reveal_token: () => "a-token",
      clipper_revoke_token: () => status(),
    });

    render(<ClipperSettingsSection />);
    fireEvent.click(await screen.findByRole("button", { name: /show token/i }));
    await screen.findByLabelText(/pairing token/i);

    fireEvent.click(screen.getByRole("button", { name: /revoke/i }));

    await waitFor(() =>
      expect(screen.queryByLabelText(/pairing token/i)).toBeNull(),
    );
    expect(screen.getByText("Disabled")).toBeDefined();
  });

  it("surfaces a failed command instead of silently doing nothing", async () => {
    answer({
      clipper_status: () => status(),
      clipper_enable: () => {
        throw new Error("another app is using port 47912");
      },
    });

    render(<ClipperSettingsSection />);
    fireEvent.click(
      await screen.findByRole("switch", { name: /enable the web clipper/i }),
    );

    expect(
      await screen.findByText("another app is using port 47912"),
    ).toBeDefined();
    expect(await screen.findByRole("alert")).toBeDefined();
  });
});
