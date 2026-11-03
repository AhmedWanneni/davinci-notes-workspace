import {
  addOrUpdateConversation,
  type AgentConversation,
  type AgentProject,
} from "@app/ai-agent";
import { persistToVault } from "./agentStorePersistence";
import { deriveConversationContextTitle } from "./agentContextTitle";
import type { ChatMessageItem } from "./agentTypes";

export async function saveActiveMessagesHelper(
  messages: ChatMessageItem[],
  conversations: AgentConversation[],
  projects: AgentProject[],
  activeConversationId: string | null,
  _activeProjectId?: string | null,
): Promise<{
  conversations: AgentConversation[];
  activeConversationId: string | null;
}> {
  if (!activeConversationId || messages.length === 0) {
    return { conversations, activeConversationId: null };
  }

  const currentConversations = [...conversations];
  const target = currentConversations.find(
    (c) => c.id === activeConversationId,
  );
  if (!target) {
    return { conversations, activeConversationId: null };
  }

  let title = target.title;
  if ((title === "New Chat" || !title) && messages.length > 0) {
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser?.content) {
      title = deriveConversationContextTitle(firstUser.content);
    }
  }

  const updatedConv: AgentConversation = {
    ...target,
    title,
    projectId: target.projectId ?? null,
    updatedAt: Date.now(),
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls,
      toolResults: m.toolResults,
      timestamp: m.timestamp,
    })),
  };

  const nextData = addOrUpdateConversation(
    {
      version: 1,
      activeConversationId,
      projects,
      conversations: currentConversations,
    },
    updatedConv,
  );

  await persistToVault(nextData);
  return { conversations: nextData.conversations, activeConversationId };
}
