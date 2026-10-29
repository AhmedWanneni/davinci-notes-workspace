import type { ListeningStatus } from "./listeningConstants";

export interface TranscriptSegmentItem {
  id: string;
  speaker: "me" | "meeting" | "system";
  text: string;
  startMs: number;
  endMs: number;
  isFinal: boolean;
}

export interface SuggestedLinkItem {
  id: string;
  title: string;
  path: string;
  reason: string;
  relevanceScore?: number;
  accepted?: boolean;
}

export interface ListeningSessionState {
  status: ListeningStatus;
  meetingTitle: string;
  startedAt: number | null;
  durationMs: number;
  micLevel: number;
  systemLevel: number;
  segments: TranscriptSegmentItem[];
  suggestedLinks: SuggestedLinkItem[];
  liveSummary: string;
  actionItems: string[];
  error?: string | null;
}
