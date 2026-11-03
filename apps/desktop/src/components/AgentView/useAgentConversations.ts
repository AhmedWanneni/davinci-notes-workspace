import { useEffect, useMemo } from "react";
import { useAgentStore } from "./useAgentStore";

export function useAgentConversations() {
  const conversations = useAgentStore((s) => s.conversations);
  const projects = useAgentStore((s) => s.projects);
  const activeConversationId = useAgentStore((s) => s.activeConversationId);
  const loadConversations = useAgentStore((s) => s.loadConversations);
  const createNewConversation = useAgentStore((s) => s.createNewConversation);
  const selectConversation = useAgentStore((s) => s.selectConversation);
  const saveActiveMessages = useAgentStore((s) => s.saveActiveMessages);
  const deleteConversation = useAgentStore((s) => s.deleteConversation);
  const renameConversation = useAgentStore((s) => s.renameConversation);
  const createProject = useAgentStore((s) => s.createProject);
  const deleteProject = useAgentStore((s) => s.deleteProject);
  const assignProject = useAgentStore((s) => s.assignProject);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  }, [conversations, activeConversationId]);

  return {
    conversations,
    projects,
    activeConversation,
    activeConversationId,
    loadConversations,
    createNewConversation,
    selectConversation,
    saveActiveMessages,
    removeConversation: deleteConversation,
    renameConversation,
    addProject: createProject,
    removeProject: deleteProject,
    assignConversationProject: assignProject,
  };
}
