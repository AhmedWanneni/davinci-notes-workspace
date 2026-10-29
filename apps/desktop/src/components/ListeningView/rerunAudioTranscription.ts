import { transcribeAudioFile } from "../../adapters/transcriptionClient";
import { createDesktopAISecretStore } from "../../ai/desktopAISecretStore";
import { detectActionItems, synthesizeMeetingSummary } from "@app/ai-agent";
import type { TranscriptSegmentItem } from "./listeningTypes";

export interface RetranscribeResult {
  segments: TranscriptSegmentItem[];
  actionItems: string[];
  summary: string;
}

export async function rerunAudioTranscription(
  filePath: string,
): Promise<RetranscribeResult> {
  const secretStore = createDesktopAISecretStore();
  const apiKey =
    (await secretStore.load("openai-compatible")) ||
    (await secretStore.load("openai")) ||
    (await secretStore.load("whisper")) ||
    "";

  const rawSegments = await transcribeAudioFile(filePath, apiKey);

  const segments: TranscriptSegmentItem[] = rawSegments.map((s, idx) => ({
    id: `seg_rerun_${s.id || idx}_${Date.now()}`,
    text: s.text,
    startMs: s.startMs,
    endMs: s.endMs,
    speaker: (s.speaker as "me" | "meeting" | "system") || "meeting",
  }));

  const fullText = segments.map((s) => s.text).join(" ");
  const actionItems = await detectActionItems(fullText);
  const summary = await synthesizeMeetingSummary(fullText);

  return {
    segments,
    actionItems,
    summary,
  };
}
