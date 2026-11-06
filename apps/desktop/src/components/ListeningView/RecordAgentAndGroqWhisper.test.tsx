// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecordAgentPicker } from "./RecordAgentPicker";
import { useAgentStore } from "../AgentView/useAgentStore";
import { getActiveRecordAgentLabel } from "./resolveRecordPageAIProvider";
import { TranscriptionSettingsCard } from "../SettingsDialog/TranscriptionSettingsCard";
import { normalizeSpeechSegment } from "./rerunAudioTranscription";

vi.mock("../AgentView/cliAgentBridge", () => ({
  detectCliAgents: vi.fn().mockResolvedValue([
    {
      id: "opencode",
      name: "OpenCode",
      binary: "opencode",
      installed: true,
      description: "Open-source autonomous agent",
      installCommand: "npm i -g opencode-ai",
    },
    {
      id: "claude",
      name: "Claude Code",
      binary: "claude",
      installed: true,
      description: "Anthropic CLI agent",
      installCommand: "npm i -g @anthropic-ai/claude-code",
    },
  ]),
  startCliAgentSession: vi.fn().mockResolvedValue(undefined),
  subscribeCliAgentStream: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("../../ai/AISubsystem", () => ({
  fetchOllamaModels: vi.fn().mockResolvedValue(["llama3.2:latest"]),
}));

vi.mock("../../adapters/transcriptionClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../adapters/transcriptionClient")>();
  return {
    ...actual,
    detectTranscriptionTools: vi.fn().mockResolvedValue({
      groqConfigured: true,
      localWhisperInstalled: true,
      localWhisperBinary: "mlx_whisper",
    }),
  };
});

const savedSecrets: Record<string, string> = {};
vi.mock("../../ai/desktopAISecretStore", () => ({
  createDesktopAISecretStore: () => ({
    load: vi.fn((k: string) => Promise.resolve(savedSecrets[k] ?? null)),
    save: vi.fn((k: string, v: string) => {
      savedSecrets[k] = v;
      return Promise.resolve();
    }),
    clear: vi.fn(),
  }),
}));

vi.mock("../../vault", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
  withDbLock: vi.fn((fn: () => unknown) => fn()),
}));

describe("Record Page AI Agent Integration & Free Groq Whisper Transcription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAgentStore.setState({
      selectedModel: "gemini-2.0-flash",
      selectedProvider: "gemini",
      selectedCliAgent: null,
      cliAgentModels: {
        agy: "gemini-2.0-flash",
        claude: "claude-3-7-sonnet",
        codex: "gpt-4o",
        opencode: "deepseek-coder",
      },
    });
  });

  it("displays AI Agent page agents in RecordAgentPicker and syncs selection with useAgentStore", async () => {
    render(<RecordAgentPicker />);

    const trigger = screen.getByTestId("record-agent-picker-trigger");
    expect(trigger.textContent).toContain("Sophia · Gemini 2.0 Flash");

    fireEvent.click(trigger);

    expect(await screen.findByTestId("record-agent-picker-menu")).toBeDefined();
    expect(screen.getByTestId("record-agent-option-sophia")).toBeDefined();
    expect(screen.getByTestId("record-agent-option-opencode")).toBeDefined();
    expect(screen.getByTestId("record-agent-option-claude")).toBeDefined();
    expect(screen.getByTestId("record-agent-option-codex")).toBeDefined();
    expect(screen.getByTestId("record-agent-option-agy")).toBeDefined();

    // Select OpenCode CLI agent
    fireEvent.click(screen.getByTestId("record-agent-option-opencode"));

    expect(useAgentStore.getState().selectedCliAgent).toBe("opencode");
    expect(getActiveRecordAgentLabel()).toContain("OpenCode");
  });

  it("allows selecting free Groq Llama model or local Ollama model from RecordAgentPicker", async () => {
    render(<RecordAgentPicker />);
    fireEvent.click(screen.getByTestId("record-agent-picker-trigger"));

    const groqModelOption = await screen.findByTestId(
      "record-model-option-llama-3.3-70b-versatile",
    );
    fireEvent.click(groqModelOption);

    expect(useAgentStore.getState().selectedCliAgent).toBeNull();
    expect(useAgentStore.getState().selectedProvider).toBe("groq");
    expect(useAgentStore.getState().selectedModel).toBe("llama-3.3-70b-versatile");
  });

  it("renders TranscriptionSettingsCard with Groq Whisper free tier models and saves Groq key", async () => {
    render(<TranscriptionSettingsCard />);

    const engineSelect = await screen.findByTestId("ai-transcription-engine-select");
    expect(engineSelect).toBeDefined();

    const modelSelect = screen.getByTestId("ai-transcription-model-select") as HTMLSelectElement;
    expect(modelSelect.value).toBe("whisper-large-v3-turbo");

    const keyInput = screen.getByTestId("groq-whisper-key-input");
    fireEvent.change(keyInput, { target: { value: "gsk_free_groq_whisper_key" } });

    fireEvent.click(screen.getByTestId("ai-transcription-save-btn"));

    await waitFor(() => {
      expect(savedSecrets["ai-transcription:groq"]).toBe("gsk_free_groq_whisper_key");
      expect(savedSecrets["groq"]).toBe("gsk_free_groq_whisper_key");
      expect(screen.getByText("Transcript Settings Saved")).toBeDefined();
    });
  });

  it("normalizes live speech segments with startMs, endMs, timestampMs, and speaker", () => {
    const seg = normalizeSpeechSegment({
      text: "Testing Groq Whisper live transcription chunk",
      speaker: "Speaker" as any,
      timestampMs: 4200,
    } as any);

    expect(seg.startMs).toBe(4200);
    expect(seg.endMs).toBe(6700);
    expect(seg.isFinal).toBe(true);
    expect(seg.speaker).toBe("me");
  });
});
