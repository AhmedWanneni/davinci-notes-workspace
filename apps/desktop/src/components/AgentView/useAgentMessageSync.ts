import { useEffect, useRef } from "react";
import { useAgentStore } from "./useAgentStore";
import type { AgentConversation } from "@app/ai-agent";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentMessageSyncOptions {
  activeConversationId: string | null;
  activeConversation: AgentConversation | null | undefined;
  messages: ChatMessageItem[];
  isStreaming: boolean;
  setMessages: (messages: ChatMessageItem[]) => void;
  saveActiveMessages: (messages: ChatMessageItem[]) => Promise<void>;
}

/**
 * Keeps the in-memory chat in sync with the persisted conversation: loads
 * messages when the active conversation changes, persists after each turn,
 * and flushes unsaved messages when the AI Agent view unmounts.
 */
export function useAgentMessageSync({
  activeConversationId,
  activeConversation,
  messages,
  isStreaming,
  setMessages,
  saveActiveMessages,
}: AgentMessageSyncOptions) {
  const lastLoadedConvIdRef = useRef<string | null>(null);
  const lastSavedKeyRef = useRef<string>("");

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  // Persist messages on unmount (e.g. closing or navigating away from the AI agent view)
  useEffect(() => {
    return () => {
      const convId = activeConversationIdRef.current;
      const msgs = messagesRef.current;
      if (convId && msgs.length > 0) {
        void useAgentStore.getState().saveActiveMessages(msgs);
      }
    };
  }, []);

  useEffect(() => {
    if (activeConversationId && activeConversation) {
      if (
        activeConversation.id !== lastLoadedConvIdRef.current ||
        (messages.length === 0 && activeConversation.messages.length > 0)
      ) {
        lastLoadedConvIdRef.current = activeConversation.id;
        setMessages(activeConversation.messages as ChatMessageItem[]);
      }
    } else if (!activeConversationId) {
      lastLoadedConvIdRef.current = null;
      setMessages([]);
    }
  }, [activeConversationId, activeConversation, messages.length, setMessages]);

  useEffect(() => {
    if (!activeConversationId || messages.length === 0 || isStreaming) return;
    const lastMsg = messages[messages.length - 1];
    const key = `${activeConversationId}:${messages.length}:${lastMsg?.id || ""}:${lastMsg?.content?.length || 0}`;
    if (key === lastSavedKeyRef.current) return;
    lastSavedKeyRef.current = key;
    void saveActiveMessages(messages);
  }, [activeConversationId, messages, isStreaming, saveActiveMessages]);
}
