import type { ListeningStatus } from "./listeningConstants";
import type {
  AIListeningAnswerItem,
  AIListeningFollowupQuestion,
} from "@app/ai-agent";
import type { RollingSummaryItem, SummaryInterval } from "./useLiveSummaries";
import type { ChatMessageItem } from "../AgentView/agentTypes";

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

export interface UseListeningSessionReturn {
  status: ListeningStatus;
  title: string;
  durationMs: number;
  micLevel: number;
  systemLevel: number;
  segments: TranscriptSegmentItem[];
  suggestedLinks: SuggestedLinkItem[];
  actionItems: string[];
  summary: string;
  createdNotePath: string | null;
  isTranscriptVisible: boolean;
  isAIListeningActive: boolean;
  liveSummary: string;
  answers: AIListeningAnswerItem[];
  questions: AIListeningFollowupQuestion[];
  aiStatus: "idle" | "streaming" | "throttled" | "error";
  aiError: string | null;
  aiRequestCount: number;
  setIsTranscriptVisible: (visible: boolean) => void;
  setIsAIListeningActive: (active: boolean) => void;
  saveAnswer: (id: string) => void;
  dismissAnswer: (id: string) => void;
  saveQuestion: (id: string) => void;
  dismissQuestion: (id: string) => void;
  triggerAIStep: () => Promise<void>;
  setTitle: (title: string) => void;
  startSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: (existingPaths?: string[]) => Promise<string | null>;
  discardSession: () => Promise<void>;
  addSegment: (segment: Omit<TranscriptSegmentItem, "id">) => void;
  acceptLink: (id: string) => void;
  dismissLink: (id: string) => void;
  retranscribeAudio: (filePath: string) => Promise<void>;
  setSuggestedLinks: React.Dispatch<React.SetStateAction<SuggestedLinkItem[]>>;
  setActionItems: React.Dispatch<React.SetStateAction<string[]>>;
  setSummary: React.Dispatch<React.SetStateAction<string>>;

  // Path A: Live Summaries
  rollingSummaries: RollingSummaryItem[];
  summaryInterval: SummaryInterval;
  setSummaryInterval: (interval: SummaryInterval) => void;
  summarizeNow: () => void;
  isAIListeningPaused: boolean;
  togglePauseAI: () => void;
  summaryStatusMessage: string | null;

  // Path B: Meeting Agent Chat
  chatMessages: ChatMessageItem[];
  isChatExecuting: boolean;
  askChatQuestion: (query: string) => Promise<void>;
  agentConversationId: string;
  simulateSpeechSegment: (text: string, speaker?: "me" | "meeting" | "system") => void;
}
