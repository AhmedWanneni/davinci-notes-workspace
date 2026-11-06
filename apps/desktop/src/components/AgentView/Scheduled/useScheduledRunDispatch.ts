import { useEffect, useState } from "react";
import type { AgentSchedule } from "@app/ai-agent";
import { useAgentStore } from "../useAgentStore";
import { useScheduleRunner } from "./useScheduleRunner";
import type { ChatMessageItem } from "../agentTypes";

interface QueuedRun {
  convId: string | null;
  prompt: string;
}

export interface ScheduledRunDispatchOptions {
  isStreaming: boolean;
  messages: ChatMessageItem[];
  activeConversationId: string | null;
  setMessages: (messages: ChatMessageItem[]) => void;
  sendMessage: (prompt: string) => Promise<void> | void;
}

/**
 * Bridges due scheduled tasks into the chat pipeline: each run opens a fresh
 * conversation titled after the task and sends its prepared prompt once that
 * conversation is active and empty (so `sendMessage` sees a clean history).
 */
export function useScheduledRunDispatch({
  isStreaming,
  messages,
  activeConversationId,
  setMessages,
  sendMessage,
}: ScheduledRunDispatchOptions) {
  const [queued, setQueued] = useState<QueuedRun | null>(null);

  useScheduleRunner({
    isBusy: isStreaming || queued !== null,
    runTask: (schedule: AgentSchedule) => {
      setQueued({ convId: null, prompt: schedule.prompt });
      void useAgentStore
        .getState()
        .createNewConversation(schedule.title, null)
        .then((conv) => {
          setMessages([]);
          setQueued({ convId: conv.id, prompt: schedule.prompt });
        })
        .catch(() => setQueued(null));
    },
  });

  useEffect(() => {
    if (!queued?.convId || isStreaming) return;
    if (activeConversationId !== queued.convId || messages.length > 0) return;
    setQueued(null);
    void sendMessage(queued.prompt);
  }, [queued, isStreaming, activeConversationId, messages.length, sendMessage]);
}
