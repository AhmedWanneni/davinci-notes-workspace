import type { AgentToolCall, AgentToolResult } from "@app/ai-api";
import type { MutationPlanResult, AgentShortcut } from "@app/ai-agent";
import type { AIProviderId } from "../../ai/AISubsystem";

export const AGENT_TAB_ID = "davinci://agent";

export interface ChatAttachmentItem {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  data?: string;
}

export interface MentionItem {
  id: string;
  type: "file" | "folder" | "current";
  path: string;
  label: string;
}

export interface AgentChatInputProps {
  onSend: (
    prompt: string,
    attachments?: ChatAttachmentItem[],
    mentions?: MentionItem[],
  ) => void;
  onCancel?: () => void;
  isStreaming: boolean;
  autoApply: boolean;
  onToggleAutoApply: (enabled: boolean) => void;
  vaultName?: string;
  projectName?: string;
  currentProvider: AIProviderId;
  currentModel: string;
  onSelectModel: (model: string, provider: AIProviderId) => void;
  selectedCliAgent?: string | null;
  onSelectCliAgent?: (agentId: string | null) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  onOpenSettings: () => void;
  onOpenConversations?: () => void;
  shortcuts?: AgentShortcut[];
  disabled?: boolean;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  attachments?: ChatAttachmentItem[];
  mentions?: MentionItem[];
  mentionsContext?: string;
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
