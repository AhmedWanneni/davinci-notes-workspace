// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getInitialAgentChoice,
  persistAgentChoice,
} from "./agentUserChoicePersistence";
import { useAgentStore } from "./useAgentStore";

describe("agentUserChoicePersistence", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = String(val);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: 0,
      key: () => null,
    };
    Object.defineProperty(window, "localStorage", {
      value: mock,
      writable: true,
      configurable: true,
    });
  });

  it("returns default choice when nothing is saved in storage", () => {
    const choice = getInitialAgentChoice();
    expect(choice.selectedCliAgent).toBeNull();
    expect(choice.selectedModel).toBe("gemini-2.0-flash");
    expect(choice.selectedProvider).toBe("gemini");
  });

  it("persists CLI agent selection and restores on next load", async () => {
    await persistAgentChoice({ selectedCliAgent: "codex" });
    const choice = getInitialAgentChoice();
    expect(choice.selectedCliAgent).toBe("codex");
  });

  it("persists model selection and clears CLI agent when cloud model chosen", async () => {
    await persistAgentChoice({ selectedCliAgent: "agy" });
    await persistAgentChoice({
      selectedModel: "claude-3-7-sonnet",
      selectedProvider: "anthropic",
      selectedCliAgent: null,
    });
    const choice = getInitialAgentChoice();
    expect(choice.selectedCliAgent).toBeNull();
    expect(choice.selectedModel).toBe("claude-3-7-sonnet");
    expect(choice.selectedProvider).toBe("anthropic");
  });

  it("useAgentStore retains user agent choice when creating new conversations", async () => {
    useAgentStore.getState().setSelectedCliAgent("claude");
    expect(useAgentStore.getState().selectedCliAgent).toBe("claude");

    await useAgentStore.getState().createNewConversation("Project Chat");
    expect(useAgentStore.getState().selectedCliAgent).toBe("claude");

    useAgentStore.getState().selectConversation(null);
    expect(useAgentStore.getState().selectedCliAgent).toBe("claude");
  });
});
