export const LISTENING_TAB_ID = "davinci://listening";
export const DEFAULT_MEETINGS_FOLDER = "Meetings";

export type ListeningStatus =
  "idle" | "recording" | "paused" | "processing" | "error";

export const CHUNK_INTERVAL_MS = 20_000;
