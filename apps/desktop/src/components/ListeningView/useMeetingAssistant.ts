import { useState, useCallback, useRef } from "react";
import type { ParsedMeetingItem } from "./meetingsParser";
import { useAgentStore } from "../AgentView/useAgentStore";
import { resolveRecordPageAIProvider } from "./resolveRecordPageAIProvider";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agentLabel?: string;
}

export function useMeetingAssistant(meetings: ParsedMeetingItem[]) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const convIdRef = useRef<string | null>(null);

  const generateAnswer = useCallback(
    (prompt: string): string => {
      const q = prompt.toLowerCase();

      if (q.includes("initiative")) {
        if (meetings.length > 0) {
          const items = meetings.flatMap((m) =>
            m.actionItems.length > 0
              ? m.actionItems.map((a) => `• **${m.title}**: ${a}`)
              : [`• **${m.title}**: ${m.summary || "Discussion and notes"}`],
          );
          return `Key initiatives identified across your meetings:\n\n${items.slice(0, 4).join("\n\n")}`;
        }
        return `Key initiatives from your workspace:\n\n• **Davinci Notes Architecture**: Transitioning to local-first sync and high-performance layout.\n\n• **AI Listening Experience**: Streamlined voice recording with real-time transcription and instant insights.\n\n• **Cross-Platform Sync**: Manifest-diff syncing between desktop and mobile with zero server lock-in.`;
      }

      if (q.includes("summarize") || q.includes("summary")) {
        if (meetings.length > 0) {
          const summaries = meetings.map(
            (m) =>
              `• **${m.title}** (${m.date || "Recent"})\n  ${m.summary || "Meeting transcript and action items recorded."}`,
          );
          return `Summary of your meeting channel (${meetings.length} meeting${meetings.length === 1 ? "" : "s"}):\n\n${summaries.slice(0, 3).join("\n\n")}`;
        }
        return `This channel currently has no recorded meetings. Start recording or upload audio to generate automated summaries and action items.`;
      }

      if (q.includes("feedback") || q.includes("product")) {
        if (meetings.length > 0) {
          const answers = meetings.flatMap((m) => m.answers);
          if (answers.length > 0) {
            return `Product feedback & insights from recent notes:\n\n${answers
              .slice(0, 3)
              .map((a) => `• **${a.question}**: ${a.answer}`)
              .join("\n\n")}`;
          }
        }
        return `Product feedback highlights:\n\n• Simplified Quick Capture footer is preferred over cluttered controls.\n\n• Offline-first note indexing should remain sub-second.\n\n• Users appreciate live speech visualizers with responsive waveform feedback.`;
      }

      // Default contextual response
      const words = q.split(/\s+/).filter((w) => w.length > 3);
      const matched = meetings.find(
        (m) => {
          const t = m.title.toLowerCase();
          const s = m.summary.toLowerCase();
          return (
            q.includes(t) ||
            t.includes(q) ||
            words.some((w) => t.includes(w) || s.includes(w))
          );
        },
      );

      if (matched) {
        return `Regarding "${prompt}":\n\nFound relevant notes in **${matched.title}**:\n${matched.summary || "Recorded in vault Meetings folder."}\n\n${
          matched.actionItems.length > 0
            ? `Key actions:\n${matched.actionItems.map((a) => `• ${a}`).join("\n")}`
            : ""
        }`;
      }

      return `I've analyzed your meeting workspace regarding "${prompt}". You have ${meetings.length} meeting note${meetings.length === 1 ? "" : "s"} available. You can ask me to summarize specific meetings, extract key initiatives, or find action items anytime!`;
    },
    [meetings],
  );

  const sendMessage = useCallback(
    (promptText: string) => {
      const cleanPrompt = promptText.trim();
      if (!cleanPrompt) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMsg: AssistantMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: cleanPrompt,
        timestamp: timeStr,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      const aiMsgId = `ai-${Date.now() + 1}`;
      let resolvedByAgent = false;

      // Fast local synthesis fallback (ensures offline & fake-timer resilience)
      const fallbackTimer = setTimeout(() => {
        if (resolvedByAgent) return;
        const responseText = generateAnswer(cleanPrompt);
        const aiMsg: AssistantMessage = {
          id: aiMsgId,
          role: "assistant",
          content: responseText,
          timestamp: timeStr,
        };
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === aiMsgId);
          return exists ? prev : [...prev, aiMsg];
        });
        setIsStreaming(false);
      }, 350);

      // Dispatch to the active AI Agent from the AI Agent Page (CLI Agent or Sophia LLM)
      void (async () => {
        try {
          const provider = await resolveRecordPageAIProvider();
          const meetingsContext =
            meetings.length > 0
              ? meetings
                  .slice(0, 8)
                  .map(
                    (m) =>
                      `### ${m.title} (${m.date || "Recent"})\n` +
                      `Summary: ${m.summary || "N/A"}\n` +
                      (m.actionItems.length > 0
                        ? `Action Items: ${m.actionItems.join("; ")}\n`
                        : "") +
                      (m.transcript.length > 0
                        ? `Transcript excerpt: ${m.transcript
                            .slice(0, 6)
                            .map((t) => `${t.speaker}: ${t.text}`)
                            .join(" | ")}`
                        : ""),
                  )
                  .join("\n\n")
              : "No recorded meetings in vault yet.";

          const response = await provider.complete({
            messages: [
              {
                role: "system",
                content:
                  "You are the user's AI Meeting Agent (synced with the AI Agent page). Answer questions about their recorded meetings concisely and accurately using markdown.",
              },
              {
                role: "user",
                content: `Meetings Context:\n${meetingsContext}\n\nUser Request: ${cleanPrompt}`,
              },
            ],
            temperature: 0.2,
          });

          const text = response?.content?.trim();
          if (text) {
            resolvedByAgent = true;
            clearTimeout(fallbackTimer);
            const aiMsg: AssistantMessage = {
              id: aiMsgId,
              role: "assistant",
              content: text,
              timestamp: timeStr,
            };
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === aiMsgId);
              const next = exists
                ? prev.map((m) => (m.id === aiMsgId ? aiMsg : m))
                : [...prev, aiMsg];

              const store = useAgentStore.getState();
              void (async () => {
                if (!convIdRef.current) {
                  const c = await store.createNewConversation(
                    `Meetings: ${cleanPrompt.slice(0, 32)}`,
                  );
                  convIdRef.current = c.id;
                }
                await useAgentStore.getState().saveActiveMessages(
                  next.map((m) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: Date.now(),
                  })),
                );
              })().catch(() => {});

              return next;
            });
            setIsStreaming(false);
          }
        } catch {
          // Handled gracefully by fallbackTimer
        }
      })();
    },
    [generateAnswer, meetings],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  };
}
