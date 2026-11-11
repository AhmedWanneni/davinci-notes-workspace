import { useState, useCallback } from "react";
import type { ParsedMeetingItem } from "./meetingsParser";
import { processAIListeningStep } from "@app/ai-agent";
import { createNoteInVault } from "../../vault/createNoteInVault";
import {
  renderMeetingMarkdown,
  type MeetingNoteParams,
} from "../../vault/meetingNoteActions";
import { resolveRecordPageAIProvider } from "./resolveRecordPageAIProvider";

export function useMeetingAIUpdater(
  onMeetingUpdated?: (updated: ParsedMeetingItem) => void,
) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const updateAIInsights = useCallback(
    async (meeting: ParsedMeetingItem) => {
      if (meeting.transcript.length === 0) {
        setUpdateError("No transcript segments found to analyze with AI.");
        return;
      }

      setIsUpdating(true);
      setUpdateError(null);

      try {
        const provider = await resolveRecordPageAIProvider();

        // Map meeting transcript to rolling segments
        const rolling = meeting.transcript.map((t, idx) => ({
          id: `seg-${idx}`,
          text: t.text,
          speaker: t.speaker.toLowerCase().includes("me")
            ? ("me" as const)
            : ("meeting" as const),
          timestampMs: idx * 5000,
        }));

        const result = await processAIListeningStep({
          provider,
          rollingSegments: rolling,
          previousSummary: meeting.summary || undefined,
        });

        // Update note in vault
        const newSummary = result.summary || meeting.summary;
        const newActions = result.answers
          ? [...meeting.actionItems, ...result.answers.map((a) => a.answer)]
          : meeting.actionItems;
        const newAnswers = result.answers
          ? [
              ...meeting.answers,
              ...result.answers.map((a) => ({
                question: a.question,
                answer: a.answer,
              })),
            ]
          : meeting.answers;

        const noteParams: MeetingNoteParams = {
          title: meeting.title,
          folder: meeting.path.split("/")[0] || "Meetings",
          summary: newSummary,
          actionItems: newActions,
          answers: newAnswers,
          questions: result.suggestedQuestions
            ? result.suggestedQuestions.map((q) => q.question)
            : meeting.questions,
          segments: meeting.transcript.map((t, i) => ({
            id: `seg-${i}`,
            text: t.text,
            speaker: t.speaker.toLowerCase().includes("me") ? "me" : "meeting",
            startMs: i * 5000,
            endMs: (i + 1) * 5000,
          })),
          audioRelPath: meeting.audioFileName
            ? `attachments/${meeting.audioFileName}`
            : undefined,
        };

        const updatedMarkdown = renderMeetingMarkdown(noteParams);
        await createNoteInVault(meeting.path, updatedMarkdown);

        const updatedMeeting: ParsedMeetingItem = {
          ...meeting,
          summary: newSummary,
          actionItems: newActions,
          answers: newAnswers,
        };

        onMeetingUpdated?.(updatedMeeting);
      } catch (err) {
        console.error("Failed to update AI insights for meeting:", err);
        setUpdateError(
          (err as Error)?.message || "Failed to generate AI insights",
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [onMeetingUpdated],
  );

  return {
    isUpdating,
    updateError,
    updateAIInsights,
  };
}
