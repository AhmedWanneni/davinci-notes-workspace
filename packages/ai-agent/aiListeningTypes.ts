export type AIItemStatus = "suggested" | "saved" | "dismissed";

export interface AIListeningSummary {
  text: string;
  timestamp: number;
}

export interface AIListeningAnswerItem {
  id: string;
  timestamp: number;
  question: string;
  answer: string;
  status: AIItemStatus;
}

export interface AIListeningFollowupQuestion {
  id: string;
  timestamp: number;
  question: string;
  status: AIItemStatus;
}

export interface AIListeningOutput {
  summary: string;
  answers: AIListeningAnswerItem[];
  suggestedQuestions: AIListeningFollowupQuestion[];
}

export interface RollingTranscriptSegment {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  speaker?: "me" | "meeting" | "system";
}
