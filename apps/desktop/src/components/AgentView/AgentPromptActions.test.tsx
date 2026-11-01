// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentPromptActions } from "./AgentPromptActions";

describe("AgentPromptActions", () => {
  it("renders voice button and waveform when cannot send", () => {
    const onVoice = vi.fn();
    render(
      <AgentPromptActions
        isStreaming={false}
        canSend={false}
        onVoiceClick={onVoice}
        onSend={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Voice input" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Start voice mode" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Start voice mode" }));
    expect(onVoice).toHaveBeenCalledTimes(1);
  });

  it("renders send button when canSend is true", () => {
    const onSend = vi.fn();
    render(
      <AgentPromptActions isStreaming={false} canSend={true} onSend={onSend} />,
    );

    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("renders stop button when streaming", () => {
    const onCancel = vi.fn();
    render(
      <AgentPromptActions
        isStreaming={true}
        canSend={true}
        onCancel={onCancel}
        onSend={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Stop generation" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stop generation" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
