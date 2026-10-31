import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  detectCliAgents,
  startCliAgentSession,
  cancelCliAgentSession,
  subscribeCliAgentStream,
} from "./cliAgentBridge";
import type { CliAgentStreamEvent } from "./cliAgentTypes";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

describe("cliAgentBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detectCliAgents invokes cli_agent_detect", async () => {
    const mockAgents = [
      { id: "agy", name: "Antigravity CLI", binary: "agy", installed: true },
    ];
    vi.mocked(invoke).mockResolvedValueOnce(mockAgents);

    const result = await detectCliAgents();
    expect(invoke).toHaveBeenCalledWith("cli_agent_detect");
    expect(result).toEqual(mockAgents);
  });

  it("startCliAgentSession invokes cli_agent_start with params", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    await startCliAgentSession("s_1", "agy", "Organize vault", "/vault/path");
    expect(invoke).toHaveBeenCalledWith("cli_agent_start", {
      sessionId: "s_1",
      agentId: "agy",
      prompt: "Organize vault",
      vaultPath: "/vault/path",
    });
  });

  it("cancelCliAgentSession invokes cli_agent_cancel", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    await cancelCliAgentSession("s_1");
    expect(invoke).toHaveBeenCalledWith("cli_agent_cancel", {
      sessionId: "s_1",
    });
  });

  it("subscribeCliAgentStream filters events by sessionId", async () => {
    let capturedCallback:
      ((event: { payload: CliAgentStreamEvent }) => void) | undefined;
    vi.mocked(listen).mockImplementationOnce(async (_name, cb) => {
      capturedCallback = cb as (event: {
        payload: CliAgentStreamEvent;
      }) => void;
      return () => {};
    });

    const onEvent = vi.fn();
    await subscribeCliAgentStream("target_session", onEvent);

    expect(listen).toHaveBeenCalledWith(
      "cli-agent-stream",
      expect.any(Function),
    );

    // Event with different session ID should be ignored
    capturedCallback?.({
      payload: { session_id: "other_session", kind: "text", content: "ignore" },
    });
    expect(onEvent).not.toHaveBeenCalled();

    // Event with matching session ID should trigger callback
    capturedCallback?.({
      payload: { session_id: "target_session", kind: "text", content: "hello" },
    });
    expect(onEvent).toHaveBeenCalledWith({
      session_id: "target_session",
      kind: "text",
      content: "hello",
    });
  });
});
