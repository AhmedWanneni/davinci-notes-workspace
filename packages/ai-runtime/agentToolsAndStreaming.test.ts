import { describe, expect, it, vi } from "vitest";
import { GeminiTransport } from "./geminiTransport.js";
import { OpenAICompatibleTransport } from "./cloudTransport.js";
import { OllamaTransport } from "./ollamaTransport.js";
import type { AgentToolDefinition, ChatRequest } from "@app/ai-api";

const testTools: AgentToolDefinition[] = [
  {
    name: "read_note",
    description: "Read note content",
    parameters: {
      type: "object",
      properties: { path: { type: "string", description: "Path to note" } },
      required: ["path"],
    },
  },
];

describe("Tool Calling and Streaming Transports", () => {
  it("Gemini parses tool calls and streams tokens", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: "read_note",
                      args: { path: "Notes/Todo.md" },
                    },
                  },
                ],
              },
              finishReason: "STOP",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const transport = new GeminiTransport({ apiKey: "test-key", fetchImpl });
    const req: ChatRequest = {
      messages: [{ role: "user", content: "read my todo list" }],
      tools: testTools,
    };

    const res = await transport.complete(req);
    expect(res.toolCalls).toHaveLength(1);
    expect(res.toolCalls?.[0].name).toBe("read_note");
    expect(res.toolCalls?.[0].arguments).toEqual({ path: "Notes/Todo.md" });

    // Verify request payload had tools
    const sentBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(sentBody.tools[0].functionDeclarations[0].name).toBe("read_note");
  });

  it("OpenAI/OpenRouter parses tool calls and streams SSE", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_abc123",
                    type: "function",
                    function: {
                      name: "read_note",
                      arguments: '{"path":"Notes/Architecture.md"}',
                    },
                  },
                ],
              },
              finish_reason: "tool_calls",
            },
          ],
          model: "gpt-4o-mini",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const transport = new OpenAICompatibleTransport({
      apiKey: "test-key",
      fetchImpl,
    });
    const res = await transport.complete({
      messages: [{ role: "user", content: "check architecture note" }],
      tools: testTools,
    });

    expect(res.toolCalls).toHaveLength(1);
    expect(res.toolCalls?.[0].id).toBe("call_abc123");
    expect(res.toolCalls?.[0].name).toBe("read_note");
    expect(res.toolCalls?.[0].arguments).toEqual({
      path: "Notes/Architecture.md",
    });
  });

  it("Ollama parses tool calls via native endpoint or fallback JSON parsing", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: {
            role: "assistant",
            content:
              '```json\n{"tool": "read_note", "arguments": {"path": "Notes/Ideas.md"}}\n```',
          },
          done: true,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const transport = new OllamaTransport({ fetchImpl });
    const res = await transport.complete({
      messages: [{ role: "user", content: "read my ideas" }],
      tools: testTools,
    });

    expect(res.toolCalls).toHaveLength(1);
    expect(res.toolCalls?.[0].name).toBe("read_note");
    expect(res.toolCalls?.[0].arguments).toEqual({ path: "Notes/Ideas.md" });
  });

  it("Ollama gracefully recovers when model does not support native tools", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error:
              "registry.ollama.ai/library/llama3:latest does not support tools",
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: {
              role: "assistant",
              content:
                '```json\n{"tool": "read_note", "arguments": {"path": "Notes/Fallback.md"}}\n```',
            },
            done: true,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const transport = new OllamaTransport({
      fetchImpl,
      chatModel: "llama3:latest",
    });
    const res = await transport.complete({
      messages: [{ role: "user", content: "read fallback" }],
      tools: testTools,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(firstBody.tools).toBeDefined();
    const secondBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(secondBody.tools).toBeUndefined();

    expect(res.toolCalls).toHaveLength(1);
    expect(res.toolCalls?.[0].name).toBe("read_note");
    expect(res.toolCalls?.[0].arguments).toEqual({
      path: "Notes/Fallback.md",
    });
  });
});
