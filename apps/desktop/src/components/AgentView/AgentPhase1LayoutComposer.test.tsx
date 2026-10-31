// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentChatInput } from "./AgentChatInput";
import { AgentScrollBottomBtn } from "./AgentScrollBottomBtn";

describe("Phase 1: Claude-Style Layout & Composer Verification", () => {
  it("Requirement 1 & 2: auto-growing textarea up to 200px and Enter-to-send vs Shift+Enter", () => {
    const onSend = vi.fn();
    render(
      <AgentChatInput
        onSend={onSend}
        isStreaming={false}
        autoApply={false}
        onToggleAutoApply={vi.fn()}
        currentProvider="gemini"
        currentModel="gemini-2.0-flash"
        onSelectModel={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText(
      "Agent prompt input",
    ) as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    // Verify initial rows is 1
    expect(textarea.getAttribute("rows")).toBe("1");

    // Simulate multi-line paste / text entry
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 120,
    });
    fireEvent.change(textarea, { target: { value: "Line 1\nLine 2\nLine 3" } });
    expect(textarea.style.height).toBe("120px");
    expect(textarea.style.overflowY).toBe("hidden");

    // Simulate huge text exceeding 200px max height
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 350,
    });
    fireEvent.change(textarea, {
      target: { value: "Line 1\nLine 2\nLine 3\n...more lines" },
    });
    expect(textarea.style.height).toBe("200px");
    expect(textarea.style.overflowY).toBe("auto");

    // Shift+Enter does NOT send (inserts newline)
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();

    // Plain Enter DOES send
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).toHaveBeenCalledWith(
      "Line 1\nLine 2\nLine 3\n...more lines",
    );
  });

  it("Requirement 4 & 5: Scroll sentinel button visibility and jump to latest trigger", () => {
    const scrollToBottom = vi.fn();
    const { rerender } = render(
      <AgentScrollBottomBtn visible={false} onClick={scrollToBottom} />,
    );

    expect(
      screen.queryByRole("button", { name: /jump to latest/i }),
    ).toBeNull();

    // User scrolled away -> button becomes visible
    rerender(<AgentScrollBottomBtn visible={true} onClick={scrollToBottom} />);
    const jumpBtn = screen.getByRole("button", { name: /jump to latest/i });
    expect(jumpBtn).toBeTruthy();

    // Clicking jump button triggers scrollToBottom
    fireEvent.click(jumpBtn);
    expect(scrollToBottom).toHaveBeenCalledTimes(1);
  });
});
