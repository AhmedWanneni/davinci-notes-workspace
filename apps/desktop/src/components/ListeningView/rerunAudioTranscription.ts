import { transcribeAudioFile } from "../../adapters/transcriptionClient";
import { createDesktopAISecretStore } from "../../ai/desktopAISecretStore";
import { detectActionItems, synthesizeMeetingSummary } from "@app/ai-agent";
import { getVaultIndexDb, getSetting, withDbLock } from "../../vault";
import {
  AI_TRANSCRIPTION_ENGINE_KEY,
  AI_TRANSCRIPTION_MODEL_KEY,
} from "../SettingsDialog/AIListeningSettingsTab";
import type { TranscriptSegmentItem } from "./listeningTypes";

export interface RetranscribeResult {
  segments: TranscriptSegmentItem[];
  actionItems: string[];
  summary: string;
}

export async function loadWhisperCredentialsAndConfig(): Promise<{
  apiKey: string;
  endpoint?: string;
  model?: string;
  engine?: string;
}> {
  const secretStore = createDesktopAISecretStore();
  const apiKey =
    (await secretStore.load("ai-transcription:groq")) ||
    (await secretStore.load("groq")) ||
    (await secretStore.load("ai-listening:groq")) ||
    (await secretStore.load("openai-compatible")) ||
    (await secretStore.load("openai")) ||
    (await secretStore.load("whisper")) ||
    "";

  let engine: string | undefined;
  let model: string | undefined;

  try {
    const db = await getVaultIndexDb().catch(() => null);
    if (db) {
      const [savedEngine, savedModel] = await withDbLock(async () => [
        await getSetting(db, AI_TRANSCRIPTION_ENGINE_KEY),
        await getSetting(db, AI_TRANSCRIPTION_MODEL_KEY),
      ]).catch(() => [null, null]);
      if (savedEngine) engine = savedEngine;
      if (savedModel) model = savedModel;
    }
  } catch {
    // Non-blocking
  }

  const endpoint = engine === "local-whisper" ? "local" : undefined;
  return { apiKey, endpoint, model, engine };
}

export async function rerunAudioTranscription(
  filePath: string,
): Promise<RetranscribeResult> {
  const { apiKey, endpoint, model } = await loadWhisperCredentialsAndConfig();

  const rawSegments =
    endpoint || model
      ? await transcribeAudioFile(filePath, apiKey, endpoint, model)
      : await transcribeAudioFile(filePath, apiKey);

  const segments: TranscriptSegmentItem[] = rawSegments.map((s, idx) => ({
    id: `seg_rerun_${s.id || idx}_${Date.now()}`,
    text: s.text,
    startMs: s.startMs,
    endMs: s.endMs,
    isFinal: true,
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

export function normalizeSpeechSegment(
  seg: Omit<TranscriptSegmentItem, "id"> & { timestampMs?: number },
): TranscriptSegmentItem {
  const rawStart = seg.startMs ?? seg.timestampMs ?? 0;
  const rawEnd = seg.endMs ?? rawStart + 2500;
  const rawSpeaker = String(seg.speaker || "me").toLowerCase();
  const speaker: "me" | "meeting" | "system" =
    rawSpeaker === "meeting" || rawSpeaker === "system" ? rawSpeaker : "me";
  return {
    id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    text: seg.text,
    speaker,
    startMs: rawStart,
    endMs: rawEnd,
    timestampMs: rawStart,
    isFinal: seg.isFinal ?? true,
  };
}

export async function transcribeRemainingAudioOnStop(
  tempWav?: string,
): Promise<TranscriptSegmentItem[]> {
  if (!tempWav) return [];
  try {
    if (typeof transcribeAudioFile !== "function") return [];
    const cfg = await loadWhisperCredentialsAndConfig();
    const raw = await transcribeAudioFile(
      tempWav,
      cfg.apiKey,
      cfg.endpoint,
      cfg.model,
    );
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((s, idx) => ({
      id: `seg_stop_${s.id ?? idx}_${Date.now()}`,
      text: s.text,
      speaker: (s.speaker as "me" | "meeting" | "system") || "me",
      startMs: s.startMs,
      endMs: s.endMs || s.startMs + 2500,
      timestampMs: s.startMs,
      isFinal: true,
    }));
  } catch {
    return [];
  }
}
