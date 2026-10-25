import type { AgentToolCall, AgentToolResult } from "@app/ai-api";

export const AGENT_CONVERSATIONS_PATH = ".davinci/agent/conversations.json";
export const CURRENT_CONVERSATIONS_VERSION = 1;

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: AgentToolCall[];
  toolResults?: AgentToolResult[];
  timestamp: number;
}

export interface AgentProject {
  id: string;
  name: string;
  createdAt: number;
}

export interface AgentConversation {
  id: string;
  title: string;
  projectId?: string | null;
  createdAt: number;
  updatedAt: number;
  messages: StoredChatMessage[];
}

export interface AgentConversationsData {
  version: number;
  activeConversationId: string | null;
  projects: AgentProject[];
  conversations: AgentConversation[];
}
