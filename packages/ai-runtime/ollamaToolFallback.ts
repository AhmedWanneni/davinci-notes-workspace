import type { AgentToolCall, AgentToolDefinition } from "@app/ai-api";

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
    "You have access to the following tools:",
    "```json",
    JSON.stringify(toolDescriptions, null, 2),
    "```",
    "If you decide to invoke a tool, you MUST respond ONLY with a JSON object in this exact format:",
    "```json",
    '{"tool": "tool_name", "arguments": {"param1": "value1"}}',
    "```",
    "Do not include any other markdown or commentary when invoking a tool.",
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
  const rawJson = jsonMatch ? jsonMatch[1].trim() : trimmed;

  if (!rawJson.startsWith("{") || !rawJson.endsWith("}")) {
    return null;
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

    if (!name) return null;
    return {
      id: `call_ollama_${Date.now()}`,
      name,
      arguments: args as Record<string, unknown>,
    };
  } catch {
    return null;
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
