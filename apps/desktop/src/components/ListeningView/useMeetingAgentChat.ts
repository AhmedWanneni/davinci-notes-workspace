import { useState, useRef, useCallback, useEffect } from "react";
import { useAgentStore } from "../AgentView/useAgentStore";
import { useAgentExecution } from "../AgentView/useAgentExecution";
import { searchMeetingTranscript } from "./searchMeetingTranscript";
import type { TranscriptSegmentItem } from "./listeningTypes";
import type { RollingSummaryItem } from "./useLiveSummaries";

export interface UseMeetingAgentChatProps {
  meetingTitle: string;
  notePath?: string | null;
  meetingNotePath?: string | null;
  segments: TranscriptSegmentItem[];
  rollingSummaries?: RollingSummaryItem[];
  summaries?: RollingSummaryItem[];
}

export function useMeetingAgentChat({
  meetingTitle,
  notePath,
  meetingNotePath,
  segments,
  rollingSummaries,
  summaries,
}: UseMeetingAgentChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const actualSummaries = rollingSummaries || summaries || [];
  const summariesRef = useRef(actualSummaries);
  summariesRef.current = actualSummaries;
  const actualNotePath = notePath || meetingNotePath;

  const createNewConversation = useAgentStore((s) => s.createNewConversation);
  const selectConversation = useAgentStore((s) => s.selectConversation);
  const saveActiveMessages = useAgentStore((s) => s.saveActiveMessages);

  const {
    messages,
    setMessages,
    sendMessage: executeAgentPrompt,
    stagedChanges,
    isStreaming,
    handleAcceptChange,
    handleRejectChange,
  } = useAgentExecution({
    autoApply: false,
  });

  // Ensure conversation exists in AgentStore so it appears on the Agent page
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;

    try {
      const conv = await createNewConversation(`Meeting: ${meetingTitle || "Recording"}`);
      setConversationId(conv.id);
      selectConversation(conv.id);
      return conv.id;
    } catch {
      const fallbackId = `conv_meeting_${Date.now()}`;
      setConversationId(fallbackId);
      return fallbackId;
    }
  }, [conversationId, createNewConversation, selectConversation, meetingTitle]);

  // Keep agent store messages synchronized with the conversation thread
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      void saveActiveMessages(messages);
    }
  }, [conversationId, messages, saveActiveMessages]);

  const askQuestion = useCallback(
    async (questionText: string) => {
      const q = questionText.trim();
      if (!q) return;

      await ensureConversation();

      // Search raw transcript using SQLite FTS5 for exact details
      const transcriptMatches = await searchMeetingTranscript(segmentsRef.current, q);

      // Build context envelope
      const summariesContext = summariesRef.current.length > 0
        ? summariesRef.current.map((s) => `[${s.timeRange}] ${s.summary}`).join("\n\n")
        : "No interval summaries generated yet.";

      const transcriptMatchContext = transcriptMatches.length > 0
        ? transcriptMatches
            .map((m) => `[${m.speaker} at ${Math.round(m.timestampMs / 1000)}s]: ${m.text}`)
            .join("\n")
        : segmentsRef.current.slice(-15)
            .map((s) => `[${s.speaker}]: ${s.text}`)
            .join("\n");

      const enrichedPrompt = `Context for current meeting: "${meetingTitle}"
${actualNotePath ? `Meeting note path: ${actualNotePath}\n` : ""}
<meeting_summaries>
${summariesContext}
</meeting_summaries>

<relevant_raw_transcript_segments>
${transcriptMatchContext}
</relevant_raw_transcript_segments>

User Question: ${q}`;

      await executeAgentPrompt(enrichedPrompt);
    },
    [ensureConversation, executeAgentPrompt, meetingTitle, notePath],
  );

  return {
    conversationId,
    messages,
    setMessages,
    isStreaming,
    stagedChanges,
    askQuestion,
    handleAcceptChange,
    handleRejectChange,
  };
}
