import {
  addOrUpdateConversation,
  deleteConversation as deleteConversationHelper,
  type AgentConversation,
  type AgentProject,
  type LibraryItem,
} from "@app/ai-agent";
import { persistToVault } from "./agentStorePersistence";

export interface ConversationActionState {
  conversations: AgentConversation[];
  projects: AgentProject[];
  libraryItems: LibraryItem[];
  activeConversationId: string | null;
  activeProjectId: string | null;
}

export async function handleCreateConversation(
  state: ConversationActionState,
  title = "New Chat",
  projectId?: string | null,
): Promise<{
  newConv: AgentConversation;
  conversations: AgentConversation[];
  activeConversationId: string;
  activeProjectId: string | null;
}> {
  const { conversations, projects, activeProjectId } = state;
  const targetProjId = projectId !== undefined ? projectId : activeProjectId;
  const newConv: AgentConversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    projectId: targetProjId ?? null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
  const nextData = addOrUpdateConversation(
    {
      version: 1,
      activeConversationId: newConv.id,
      projects,
      conversations,
      libraryItems: state.libraryItems,
    },
    newConv,
  );
  await persistToVault(nextData, true);
  return {
    newConv,
    conversations: nextData.conversations,
    activeConversationId: newConv.id,
    activeProjectId: targetProjId ?? null,
  };
}

export async function handleDeleteConversation(
  state: ConversationActionState,
  id: string,
): Promise<{
  conversations: AgentConversation[];
  activeConversationId: string | null;
}> {
  const { conversations, projects, activeConversationId, libraryItems } = state;
  const nextData = deleteConversationHelper(
    {
      version: 1,
      activeConversationId,
      projects,
      conversations,
      libraryItems,
    },
    id,
  );
  await persistToVault(nextData, true);
  return {
    conversations: nextData.conversations,
    activeConversationId: nextData.activeConversationId,
  };
}

export async function handleRenameConversation(
  state: ConversationActionState,
  id: string,
  title: string,
): Promise<AgentConversation[]> {
  const { conversations, projects, activeConversationId, libraryItems } = state;
  const target = conversations.find((c) => c.id === id);
  if (!target) return conversations;
  const updated = {
    ...target,
    title: title.trim() || "Untitled",
    updatedAt: Date.now(),
  };
  const nextData = addOrUpdateConversation(
    {
      version: 1,
      activeConversationId,
      projects,
      conversations,
      libraryItems,
    },
    updated,
  );
  await persistToVault(nextData);
  return nextData.conversations;
}
