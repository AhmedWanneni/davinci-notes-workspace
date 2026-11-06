// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentPromptActions } from "./AgentPromptActions";

describe("AgentPromptActions", () => {
  it("renders the send control without microphone controls", () => {
    render(
      <AgentPromptActions
        isStreaming={false}
        onSend={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
    expect(screen.queryByLabelText(/voice|microphone/i)).toBeNull();
  });

  it("renders the send button", () => {
    const onSend = vi.fn();
    render(
      <AgentPromptActions isStreaming={false} onSend={onSend} />,
    );

    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("shows a pause control to stop the agent while streaming", () => {
    const onCancel = vi.fn();
    render(
      <AgentPromptActions
        isStreaming={true}
        onCancel={onCancel}
        onSend={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Stop agent" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stop agent" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("replaces send with pause when the working state starts", () => {
    const onCancel = vi.fn();
    const { rerender } = render(
      <AgentPromptActions isStreaming={false} onSend={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();

    rerender(
      <AgentPromptActions isStreaming={true} onCancel={onCancel} onSend={vi.fn()} />,
    );
    const pause = screen.getByRole("button", { name: "Stop agent" });
    fireEvent.click(pause);
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
