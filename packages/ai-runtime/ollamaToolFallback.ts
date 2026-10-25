import type { AgentToolCall, AgentToolDefinition, ChatRequest } from "@app/ai-api";
import { extractConversationalToolCall } from "./conversationalToolFallback.js";

export function formatOllamaToolSystemPrompt(
  existingSystemPrompt: string,
  tools: AgentToolDefinition[],
): string {
  const toolDescriptions = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters ?? {},
  }));

  const guidance = [
    existingSystemPrompt.trim(),
    "MANDATORY TOOL EXECUTION INSTRUCTIONS:",
    "You have access to the following tools:",
    "```json",
    JSON.stringify(toolDescriptions, null, 2),
    "```",
    "CRITICAL RULES:",
    "1. You CANNOT create, edit, delete, or inspect notes/folders with conversational text. Talking about creating a note does NOT create it.",
    "2. If asked to create, edit, delete, or inspect notes or folders, NEVER say 'I have created...', 'I created...', or describe doing it.",
    "3. You MUST respond ONLY with a JSON object calling the appropriate tool:",
    "```json",
    '{"tool": "tool_name", "arguments": {"param1": "value1"}}',
    "```",
    "4. Do not output any conversational text or markdown outside of the JSON tool call.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return guidance;
}

export function extractOllamaFallbackToolCall(
  text: string,
): AgentToolCall | null {
  const trimmed = text.trim();
  const jsonMatch = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(trimmed);
  let rawJson = jsonMatch ? jsonMatch[1].trim() : trimmed;

  if (!rawJson.startsWith("{") || !rawJson.endsWith("}")) {
    const embeddedMatch =
      /\{[\s\S]*?"(?:tool|name)"\s*:\s*"[^"]+"[\s\S]*?\}/.exec(trimmed);
    if (embeddedMatch) {
      rawJson = embeddedMatch[0].trim();
    } else {
      return extractConversationalToolCall(trimmed);
    }
  }

  try {
    const parsed = JSON.parse(rawJson) as {
      tool?: unknown;
      name?: unknown;
      arguments?: unknown;
      parameters?: unknown;
    };
    const name =
      typeof parsed.tool === "string"
        ? parsed.tool
        : typeof parsed.name === "string"
          ? parsed.name
          : null;
    const args =
      typeof parsed.arguments === "object" && parsed.arguments !== null
        ? parsed.arguments
        : typeof parsed.parameters === "object" && parsed.parameters !== null
          ? parsed.parameters
          : {};

    if (!name) return extractConversationalToolCall(trimmed);
    return {
      id: `call_ollama_${Date.now()}`,
      name,
      arguments: args as Record<string, unknown>,
    };
  } catch {
    return extractConversationalToolCall(trimmed);
  }
}

export interface RawOllamaToolCall {
  function?: { name: string; arguments: Record<string, unknown> };
}

export function parseOllamaToolCalls(raw?: RawOllamaToolCall[]): AgentToolCall[] {
  if (!raw) return [];
  return raw
    .filter((item) => item.function?.name)
    .map((item, idx) => ({
      id: `call_ollama_${Date.now()}_${idx}`,
      name: item.function!.name,
      arguments: item.function!.arguments ?? {},
    }));
}

export function isToolSupportError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string" &&
    (err as { message: string }).message.toLowerCase().includes("does not support tools")
  );
}

export function buildOllamaChatPayload(
  request: ChatRequest,
  chatModel?: string,
  stream = false,
) {
  const hasTools = Boolean(request.tools && request.tools.length > 0);
  const messages = request.messages.map((m) => {
    if (m.role === "system" && hasTools && request.tools) {
      return {
        role: "system",
        content: formatOllamaToolSystemPrompt(m.content, request.tools),
      };
    }
    if (m.role === "tool") {
      return {
        role: "user",
        content: `[Tool Result: ${m.name ?? "tool"}]: ${m.content}`,
      };
    }
    if (
      m.role === "assistant" &&
      !m.content &&
      m.toolCalls &&
      m.toolCalls.length > 0
    ) {
      return {
        role: "assistant",
        content: `[Action: called ${m.toolCalls[0].name}]`,
      };
    }
    return { role: m.role, content: m.content || "" };
  });

  if (
    hasTools &&
    !messages.some((m) => m.role === "system") &&
    request.tools
  ) {
    messages.unshift({
      role: "system",
      content: formatOllamaToolSystemPrompt("", request.tools),
    });
  }

  return {
    model: chatModel,
    messages,
    stream,
    ...(hasTools ? { tools: request.tools } : {}),
  };
}
