export type CaptureType = "text" | "url" | "image" | "audio";

export type CaptureDestination = "quick-notes" | "inbox" | "daily";

export interface CapturedItem {
  type: CaptureType;
  text?: string;
  url?: string;
  title?: string;
  fileUri?: string;
  filename?: string;
  mimeType?: string;
  timestamp?: number;
}

export interface CaptureResult {
  targetNotePath: string;
  attachmentPath?: string;
  isNewNote: boolean;
  contentAppended: string;
}

export interface MediaPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined";
}
