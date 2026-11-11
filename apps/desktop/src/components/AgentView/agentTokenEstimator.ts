import type { ChatMessageItem } from "./agentTypes";

export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  agy: 1_000_000,
  claude: 200_000,
  codex: 128_000,
  opencode: 128_000,
  "gemini-2.0-flash": 1_000_000,
  "gemini-1.5-pro": 2_000_000,
  "gemini-1.5-flash": 1_000_000,
  "claude-3-7-sonnet": 200_000,
  "claude-3-5-sonnet": 200_000,
  "gpt-4o": 128_000,
  "gpt-4o-mini": 128_000,
  "deepseek-chat": 128_000,
  "deepseek-coder": 128_000,
  "llama-3.3-70b-versatile": 128_000,
  "mistral-large": 128_000,
  default: 32_768,
};

export interface ContextBudgetInfo {
  usedTokens: number;
  maxTokens: number;
  percentage: number;
  status: "normal" | "warning" | "critical";
  warningLabel: string;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 3.8);
}

export function getContextLimit(
  agentId: string | null,
  modelId: string,
): number {
  if (agentId && MODEL_CONTEXT_WINDOWS[agentId]) {
    return MODEL_CONTEXT_WINDOWS[agentId];
  }
  const cleanModel = modelId.toLowerCase().trim();
  for (const [key, limit] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (cleanModel.includes(key) || key.includes(cleanModel)) {
      return limit;
    }
  }
  return MODEL_CONTEXT_WINDOWS.default;
}

export function estimateConversationTokens(
  messages: ChatMessageItem[] = [],
  promptText = "",
): number {
  let chars = promptText ? promptText.length : 0;
  for (const msg of messages) {
    chars += (msg.content || "").length;
    if (msg.toolCalls) {
      chars += JSON.stringify(msg.toolCalls).length;
    }
    if (msg.toolResults) {
      chars += JSON.stringify(msg.toolResults).length;
    }
  }
  return Math.ceil(chars / 3.8);
}

export function calculateContextBudget(
  messages: ChatMessageItem[] = [],
  promptText = "",
  agentId: string | null = null,
  modelId = "gemini-2.0-flash",
): ContextBudgetInfo {
  const usedTokens = estimateConversationTokens(messages, promptText);
  const maxTokens = getContextLimit(agentId, modelId);
  const percentage = Math.min(
    100,
    Math.round((usedTokens / Math.max(1, maxTokens)) * 100),
  );

  let status: "normal" | "warning" | "critical" = "normal";
  let warningLabel = "";

  if (percentage >= 90) {
    status = "critical";
    warningLabel = `Running out of tokens: ${percentage}% context used`;
  } else if (percentage >= 70) {
    status = "warning";
    warningLabel = `Agent nearing token limit: ${percentage}% context used`;
  }

  return {
    usedTokens,
    maxTokens,
    percentage,
    status,
    warningLabel,
  };
}
