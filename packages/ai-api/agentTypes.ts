export interface ToolParameterProperty {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description?: string;
  enum?: string[];
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface ToolParameterSchema {
  type: "object";
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
  description?: string;
}

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters?: ToolParameterSchema;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  isError?: boolean;
}

export interface ChatStreamChunkDelta {
  role?: "assistant";
  content?: string;
  toolCalls?: Array<{
    index: number;
    id?: string;
    name?: string;
    argumentsDelta?: string;
  }>;
}

export interface ChatStreamChunk {
  delta: ChatStreamChunkDelta;
  finishReason?: "stop" | "tool_calls" | "length" | "content_filter" | "error";
  model?: string;
}
