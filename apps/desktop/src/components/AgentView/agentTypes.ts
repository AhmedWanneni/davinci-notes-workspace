import type { AgentToolCall, AgentToolResult } from "@app/ai-api";
import type { MutationPlanResult } from "@app/ai-agent";

export const AGENT_TAB_ID = "davinci://agent";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: AgentToolCall[];
  toolResults?: AgentToolResult[];
  timestamp: number;
  isStreaming?: boolean;
}

export interface StagedChangeItem {
  id: string;
  toolName: string;
  plan: MutationPlanResult;
  status: "pending" | "accepted" | "rejected";
}
