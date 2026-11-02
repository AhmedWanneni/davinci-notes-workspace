// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIListeningSettingsTab } from "./AIListeningSettingsTab";

const mockSecrets: Record<string, string> = {};

vi.mock("../../ai/desktopAISecretStore", () => ({
  createDesktopAISecretStore: () => ({
    load: vi
      .fn()
      .mockImplementation((key: string) =>
        Promise.resolve(mockSecrets[key] ?? null),
      ),
    save: vi.fn().mockImplementation((key: string, val: string) => {
      mockSecrets[key] = val;
      return Promise.resolve();
    }),
    clear: vi.fn().mockImplementation((key: string) => {
      delete mockSecrets[key];
      return Promise.resolve();
    }),
  }),
}));

vi.mock("../../vault", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
  withDbLock: vi
    .fn()
    .mockImplementation(async (cb: () => Promise<unknown>) => cb()),
}));

describe("AIListeningSettingsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders provider select, key input, model input, and privacy warning for Gemini", async () => {
    render(<AIListeningSettingsTab />);

    expect(
      await screen.findByTestId("ai-listening-settings-tab"),
    ).toBeDefined();
    expect(screen.getByTestId("ai-listening-provider-select")).toBeDefined();
    expect(screen.getByTestId("gemini-privacy-warning")).toBeDefined();
    expect(screen.getByTestId("ai-listening-key-input")).toBeDefined();
    expect(screen.getByTestId("ai-listening-model-input")).toBeDefined();
    expect(screen.getByTestId("ai-listening-throttle-select")).toBeDefined();
  });

  it("hides Gemini privacy warning when changing provider to OpenAI-compatible", async () => {
    render(<AIListeningSettingsTab />);

    const select = await screen.findByTestId("ai-listening-provider-select");
    expect(screen.getByTestId("gemini-privacy-warning")).toBeDefined();

    fireEvent.change(select, { target: { value: "openai-compatible" } });

    await waitFor(() => {
      expect(screen.queryByTestId("gemini-privacy-warning")).toBeNull();
    });
  });

  it("saves API key and settings on click", async () => {
    render(<AIListeningSettingsTab />);

    const keyInput = await screen.findByTestId("ai-listening-key-input");
    fireEvent.change(keyInput, { target: { value: "test-secret-key-123" } });

    const saveBtn = screen.getByTestId("ai-listening-save-btn");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeDefined();
    });
  });
});
