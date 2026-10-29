import { useState, useCallback, useRef, useEffect } from "react";
import {
  AGENT_CONVERSATIONS_PATH,
  parseConversationsData,
  serializeConversationsData,
  addOrUpdateConversation,
  deleteConversation,
  createProject,
  deleteProject,
  moveConversationToProject,
  type AgentConversationsData,
  type AgentConversation,
} from "@app/ai-agent";
import { readNote, writeNote } from "../../vault/vaultCommands";
import type { ChatMessageItem } from "./agentTypes";

export function useAgentConversations() {
  const [data, setData] = useState<AgentConversationsData>({
    version: 1,
    activeConversationId: null,
    projects: [{ id: "proj_general", name: "General", createdAt: Date.now() }],
    conversations: [],
  });
  const dataRef = useRef(data);
  dataRef.current = data;

  const loadConversations = useCallback(async () => {
    try {
      const file = await readNote(AGENT_CONVERSATIONS_PATH);
      let parsed = parseConversationsData(file.content);
      if (
        (!parsed.activeConversationId ||
          !parsed.conversations.some(
            (c) => c.id === parsed.activeConversationId,
          )) &&
        parsed.conversations.length > 0
      ) {
        parsed = { ...parsed, activeConversationId: parsed.conversations[0].id };
      }
      setData(parsed);
      return parsed;
    } catch {
      const initial = parseConversationsData(null);
      setData(initial);
      return initial;
    }
  }, []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const persistData = useCallback(
    async (nextData: AgentConversationsData, immediate = false) => {
      setData(nextData);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const doWrite = async () => {
        try {
          await writeNote(
            AGENT_CONVERSATIONS_PATH,
            serializeConversationsData(nextData),
          );
        } catch (e) {
          console.warn("[agent] Failed to save conversations:", e);
        }
      };
      if (immediate) {
        await doWrite();
      } else {
        debounceTimerRef.current = setTimeout(() => {
          void doWrite();
        }, 1000);
      }
    },
    [],
  );

  const createNewConversation = useCallback(
    async (title = "New Chat", projectId?: string | null) => {
      const newConv: AgentConversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        projectId: projectId ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      const updated = addOrUpdateConversation(dataRef.current, newConv);
      await persistData(updated, true);
      return newConv;
    },
    [persistData],
  );

  const selectConversation = useCallback(
    async (id: string) => {
      const updated: AgentConversationsData = {
        ...dataRef.current,
        activeConversationId: id,
      };
      await persistData(updated, true);
    },
    [persistData],
  );

  const saveActiveMessages = useCallback(
    async (messages: ChatMessageItem[]) => {
      let currentData = dataRef.current;
      let activeId = currentData.activeConversationId;
      let conv = activeId
        ? currentData.conversations.find((c) => c.id === activeId)
        : undefined;

      // Auto-create a conversation if none exists so messages are never lost on navigation
      if (!conv) {
        const newConv: AgentConversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: "New Chat",
          projectId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        currentData = addOrUpdateConversation(currentData, newConv);
        activeId = newConv.id;
        conv = newConv;
      }

      // Auto-title from first user message if still untitled or default
      let title = conv.title;
      if ((title === "New Chat" || !title) && messages.length > 0) {
        const firstUser = messages.find((m) => m.role === "user");
        if (firstUser?.content) {
          title = firstUser.content.slice(0, 36).trim();
          if (firstUser.content.length > 36) title += "…";
        }
      }

      const updatedConv: AgentConversation = {
        ...conv,
        title,
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

      const nextData = {
        ...addOrUpdateConversation(currentData, updatedConv),
        activeConversationId: activeId,
      };
      await persistData(nextData);
    },
    [persistData],
  );

  const removeConversation = useCallback(
    async (id: string) => {
      const updated = deleteConversation(dataRef.current, id);
      await persistData(updated);
    },
    [persistData]
  );

  const renameConversation = useCallback(
    async (id: string, nextTitle: string) => {
      const conv = dataRef.current.conversations.find((c) => c.id === id);
      if (!conv) return;
      const updatedConv = { ...conv, title: nextTitle.trim() || "Untitled", updatedAt: Date.now() };
      const nextData = addOrUpdateConversation(dataRef.current, updatedConv);
      await persistData(nextData);
    },
    [persistData]
  );

  const addProject = useCallback(
    async (name: string) => {
      const { data: nextData, project } = createProject(dataRef.current, name);
      await persistData(nextData);
      return project;
    },
    [persistData]
  );

  const removeProject = useCallback(
    async (projectId: string) => {
      const nextData = deleteProject(dataRef.current, projectId);
      await persistData(nextData);
    },
    [persistData]
  );

  const assignConversationProject = useCallback(
    async (conversationId: string, projectId: string | null) => {
      const nextData = moveConversationToProject(dataRef.current, conversationId, projectId);
      await persistData(nextData);
    },
    [persistData]
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const activeConversation =
    data.conversations.find((c) => c.id === data.activeConversationId) ?? null;

  return {
    conversations: data.conversations,
    projects: data.projects,
    activeConversation,
    activeConversationId: data.activeConversationId,
    loadConversations,
    createNewConversation,
    selectConversation,
    saveActiveMessages,
    removeConversation,
    renameConversation,
    addProject,
    removeProject,
    assignConversationProject,
  };
}
