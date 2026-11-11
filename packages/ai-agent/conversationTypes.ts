import type { AgentToolCall, AgentToolResult } from "@app/ai-api";

export const AGENT_CONVERSATIONS_PATH = ".davinci/agent/conversations.json";
export const AI_LIBRARY_DIR = "ai-library";
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
  sources?: string[];
  instructions?: string;
}

export type LibraryItemType = "prompt" | "skill" | "rule";

export interface LibraryItem {
  id: string;
  projectId?: string | null;
  type: LibraryItemType;
  title: string;
  description?: string;
  content: string;
  tags?: string[];
  filePath?: string;
  createdAt: number;
  updatedAt: number;
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
  libraryItems?: LibraryItem[];
}
