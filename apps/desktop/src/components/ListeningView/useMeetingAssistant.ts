import { useState, useCallback } from "react";
import type { ParsedMeetingItem } from "./meetingsParser";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useMeetingAssistant(meetings: ParsedMeetingItem[]) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

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

      // Fast, smooth AI response delivery
      setTimeout(() => {
        const responseText = generateAnswer(cleanPrompt);
        const aiMsg: AssistantMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: responseText,
          timestamp: timeStr,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsStreaming(false);
      }, 350);
    },
    [generateAnswer],
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
