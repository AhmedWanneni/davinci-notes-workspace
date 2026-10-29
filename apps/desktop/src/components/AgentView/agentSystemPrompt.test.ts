import { describe, it, expect } from "vitest";
import {
  buildAgentWorkingHistory,
  buildAgentSystemPrompt,
  MAX_WORKING_HISTORY_MESSAGES,
  MAX_TOOL_CONTENT_LENGTH,
} from "./agentSystemPrompt";
import type { ChatMessageItem } from "./agentTypes";

describe("agentSystemPrompt memory optimizations", () => {
  it("bounds working history to the last 8 messages", () => {
    const messages: ChatMessageItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: `msg_${i}`,
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
      timestamp: Date.now() + i,
    }));

    const history = buildAgentWorkingHistory("System prompt", messages);
    // 1 system message + MAX_WORKING_HISTORY_MESSAGES
    expect(history.length).toBe(MAX_WORKING_HISTORY_MESSAGES + 1);
    expect(history[0].role).toBe("system");
    expect(history[1].content).toBe("Message 7");
    expect(history[history.length - 1].content).toBe("Message 14");
  });

  it("truncates massive tool output contents over 1000 characters", () => {
    const hugeContent = "X".repeat(2500);
    const messages: ChatMessageItem[] = [
      {
        id: "msg_tool_1",
        role: "tool",
        content: hugeContent,
        name: "search_vault",
        timestamp: Date.now(),
      },
    ];

    const history = buildAgentWorkingHistory("System prompt", messages);
    expect(history[1].content.length).toBeLessThan(hugeContent.length);
    expect(history[1].content).toContain("truncated for memory optimization");
    expect(history[1].content.length).toBeLessThanOrEqual(MAX_TOOL_CONTENT_LENGTH + 50);
  });

  it("caps sampled notes in system prompt to 15 notes", () => {
    const allNotePaths = Array.from({ length: 50 }, (_, i) => `Note_${i}.md`);
    const prompt = buildAgentSystemPrompt({
      vaultName: "TestVault",
      allNotePaths,
      allFolderPaths: ["Folder1"],
    });

    expect(prompt).toContain("Note_0.md");
    expect(prompt).toContain("Note_14.md");
    expect(prompt).not.toContain("Note_15.md");
    expect(prompt).toContain("and 35 more notes");
  });
});
