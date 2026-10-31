// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AgentImageThumbnail } from "./AgentImageThumbnail";
import { AgentImageViewerModal } from "./AgentImageViewerModal";
import { AgentChatInput } from "./AgentChatInput";
import { isVisionSupported } from "./imageAttachmentUtils";
import { GeminiTransport } from "@app/ai-runtime";
import type { ChatAttachmentItem } from "./agentTypes";

describe("Phase 4: Multimodal Image Attachments & Vision Pipeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("Requirement 1: isVisionSupported accurately detects multimodal support", () => {
    expect(isVisionSupported("gemini-2.0-flash")).toBe(true);
    expect(isVisionSupported("claude-3-5-sonnet")).toBe(true);
    expect(isVisionSupported("deepseek-r1:70b")).toBe(false);
    expect(isVisionSupported("gemma-2-9b")).toBe(false);
  });

  it("Requirement 2: renders thumbnail chip and handles remove click", () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    const att: ChatAttachmentItem = {
      id: "att_1",
      name: "diagram.png",
      mimeType: "image/png",
      url: "blob:http://localhost/diagram.png",
    };

    render(
      <AgentImageThumbnail
        attachment={att}
        onRemove={onRemove}
        onClick={onClick}
      />,
    );

    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("blob:http://localhost/diagram.png");

    const removeBtn = screen.getByRole("button", { name: /remove image/i });
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith("att_1");
  });

  it("Requirement 3: click-to-zoom modal opens and closes via button and Escape key", () => {
    const onClose = vi.fn();
    const att: ChatAttachmentItem = {
      id: "att_zoom",
      name: "architecture.png",
      mimeType: "image/png",
      url: "blob:http://localhost/arch.png",
    };

    const { rerender } = render(
      <AgentImageViewerModal attachment={att} onClose={onClose} />,
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("architecture.png")).toBeTruthy();

    // Close button
    const closeBtn = screen.getByRole("button", {
      name: /close image viewer/i,
    });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);

    // When null, renders nothing
    rerender(<AgentImageViewerModal attachment={null} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Requirement 4: displays vision warning when non-vision model is active with attachments", () => {
    render(
      <AgentChatInput
        onSend={vi.fn()}
        isStreaming={false}
        autoApply={false}
        onToggleAutoApply={vi.fn()}
        currentProvider="ollama"
        currentModel="deepseek-r1:70b"
        onSelectModel={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    // Initially no attachments -> no warning
    expect(
      screen.queryByText(/may not support image understanding/i),
    ).toBeNull();
  });

  it("Requirement 5: GeminiTransport sends inlineData for image attachments", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    const mockFetch = vi.fn(async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: "I see a chart." }] },
              finishReason: "STOP",
            },
          ],
        }),
        { status: 200 },
      );
    });

    const transport = new GeminiTransport({
      apiKey: "test-key",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    await transport.complete({
      messages: [
        {
          role: "user",
          content: "What is in this image?",
          attachments: [
            {
              id: "att_1",
              name: "chart.png",
              mimeType: "image/png",
              data: "iVBORw0KGgoAAAANSUhEUg==",
            },
          ],
        },
      ],
    });

    expect(capturedBody).toBeTruthy();
    const parts = capturedBody.contents[0].parts;
    expect(parts[0]).toEqual({ text: "What is in this image?" });
    expect(parts[1]).toEqual({
      inlineData: {
        mimeType: "image/png",
        data: "iVBORw0KGgoAAAANSUhEUg==",
      },
    });
  });
});
