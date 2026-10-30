import {
  CURRENT_CONVERSATIONS_VERSION,
  type AgentConversation,
  type AgentConversationsData,
  type AgentProject,
} from "./conversationTypes";

export function createEmptyConversationsData(): AgentConversationsData {
  return {
    version: CURRENT_CONVERSATIONS_VERSION,
    activeConversationId: null,
    projects: [
      { id: "proj_general", name: "General", createdAt: Date.now() },
    ],
    conversations: [],
  };
}

export function parseConversationsData(raw: string | null | undefined): AgentConversationsData {
  if (!raw || !raw.trim()) {
    return createEmptyConversationsData();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AgentConversationsData>;
    return {
      version: parsed.version ?? CURRENT_CONVERSATIONS_VERSION,
      activeConversationId: parsed.activeConversationId ?? null,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
    };
  } catch {
    return createEmptyConversationsData();
  }
}

export function serializeConversationsData(data: AgentConversationsData): string {
  return JSON.stringify(data, null, 2);
}

export function addOrUpdateConversation(
  data: AgentConversationsData,
  conversation: AgentConversation
): AgentConversationsData {
  const existingIndex = data.conversations.findIndex((c) => c.id === conversation.id);
  const updatedList = [...data.conversations];

  if (existingIndex >= 0) {
    updatedList[existingIndex] = conversation;
  } else {
    updatedList.unshift(conversation);
  }

  return {
    ...data,
    activeConversationId: conversation.id,
    conversations: updatedList,
  };
}

export function deleteConversation(
  data: AgentConversationsData,
  conversationId: string
): AgentConversationsData {
  const nextConversations = data.conversations.filter((c) => c.id !== conversationId);
  const nextActive =
    data.activeConversationId === conversationId
      ? nextConversations[0]?.id ?? null
      : data.activeConversationId;

  return {
    ...data,
    activeConversationId: nextActive,
    conversations: nextConversations,
  };
}

export function createProject(
  data: AgentConversationsData,
  name: string
): { data: AgentConversationsData; project: AgentProject } {
  const trimmed = name.trim();
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const project: AgentProject = {
    id,
    name: trimmed || "Untitled Project",
    createdAt: Date.now(),
  };

  return {
    data: {
      ...data,
      projects: [...data.projects, project],
    },
    project,
  };
}

export function deleteProject(
  data: AgentConversationsData,
  projectId: string
): AgentConversationsData {
  return {
    ...data,
    projects: data.projects.filter((p) => p.id !== projectId),
    // Reset any conversations belonging to this project back to null
    conversations: data.conversations.map((c) =>
      c.projectId === projectId ? { ...c, projectId: null } : c
    ),
  };
}

export function moveConversationToProject(
  data: AgentConversationsData,
  conversationId: string,
  projectId: string | null
): AgentConversationsData {
  return {
    ...data,
    conversations: data.conversations.map((c) =>
      c.id === conversationId ? { ...c, projectId, updatedAt: Date.now() } : c
    ),
  };
}
