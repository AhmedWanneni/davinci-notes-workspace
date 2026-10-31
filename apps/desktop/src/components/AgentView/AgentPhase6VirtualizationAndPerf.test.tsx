// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentMessageList, VIRTUALIZATION_THRESHOLD } from "./AgentMessageList";
import { createChunkBatcher } from "./agentExecutionHelpers";
import type { ChatMessageItem } from "./agentTypes";

describe("Phase 6: Virtualization & Performance Pass", () => {
  describe("AgentMessageList", () => {
    it("renders empty state with starter prompts when no messages", () => {
      const scrollRef = { current: document.createElement("div") };
      render(
        <AgentMessageList
          messages={[]}
          scrollRef={scrollRef}
          vaultName="TestVault"
          onSendMessage={vi.fn()}
          onEditMessage={vi.fn()}
          onRegenerateMessage={vi.fn()}
        />,
      );

      expect(
        screen.getByText(/What would you like to explore or create/i),
      ).toBeTruthy();
    });

    it("renders non-virtualized direct list when messages count is below threshold (<20)", () => {
      const scrollRef = { current: document.createElement("div") };
      const messages: ChatMessageItem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `msg_${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message content number ${i}`,
        timestamp: Date.now() + i,
      }));

      const { container } = render(
        <AgentMessageList
          messages={messages}
          scrollRef={scrollRef}
          onSendMessage={vi.fn()}
          onEditMessage={vi.fn()}
          onRegenerateMessage={vi.fn()}
        />,
      );

      // Virtual container should not exist
      expect(container.querySelector(".agent-view__virtual-container")).toBeNull();
      // All 5 messages rendered
      expect(screen.getByText("Message content number 0")).toBeTruthy();
      expect(screen.getByText("Message content number 4")).toBeTruthy();
    });

    it("activates virtualization when messages reach threshold (>=20)", () => {
      const scrollRef = { current: document.createElement("div") };
      const messages: ChatMessageItem[] = Array.from(
        { length: VIRTUALIZATION_THRESHOLD + 5 },
        (_, i) => ({
          id: `msg_${i}`,
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Virtual message ${i}`,
          timestamp: Date.now() + i,
        }),
      );

      const { container } = render(
        <AgentMessageList
          messages={messages}
          scrollRef={scrollRef}
          onSendMessage={vi.fn()}
          onEditMessage={vi.fn()}
          onRegenerateMessage={vi.fn()}
        />,
      );

      // Virtual container should exist
      const virtualContainer = container.querySelector(
        ".agent-view__virtual-container",
      );
      expect(virtualContainer).not.toBeNull();
    });
  });

  describe("createChunkBatcher", () => {
    it("buffers tokens and flushes on finish", () => {
      const setMessages = vi.fn();
      const batcher = createChunkBatcher("msg_1", setMessages);

      batcher.push("Hello");
      batcher.push(" world");

      const finalMsg: ChatMessageItem = {
        id: "msg_1",
        role: "assistant",
        content: "Hello world!",
        timestamp: Date.now(),
      };

      batcher.finish(finalMsg);

      expect(setMessages).toHaveBeenCalled();
    });

    it("flushes intermediate buffer immediately on flush()", () => {
      const setMessages = vi.fn();
      const batcher = createChunkBatcher("msg_2", setMessages);

      batcher.push("Immediate chunk");
      batcher.flush();

      expect(setMessages).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
