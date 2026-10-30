/**
 * The extension → desktop clip contract (ADR-0176, plan §4).
 *
 * This is a wire format: everything the extension sends is hostile input and is
 * re-validated on the desktop. `folder` and `noteName` are explicitly untrusted.
 * Keep this file dependency-free and free of DOM/Tauri types.
 */

export const CLIP_PAYLOAD_VERSION = 1 as const;

export type ClipMode = "full" | "selection" | "highlights" | "bookmark";

export type ClipBehavior =
  | "create"
  | "append-bottom"
  | "append-top"
  | "prepend"
  | "daily-append"
  | "daily-prepend";

export const CLIP_BEHAVIORS: readonly ClipBehavior[] = [
  "create",
  "append-bottom",
  "append-top",
  "prepend",
  "daily-append",
  "daily-prepend",
];

/** Page metadata. Every field is untrusted text from the page. */
export interface ClipSource {
  url: string;
  title: string;
  site?: string;
  domain?: string;
  author?: string;
  published?: string;
  description?: string;
  image?: string;
  favicon?: string;
  language?: string;
  wordCount?: number;
}

export interface ClipHighlight {
  text: string;
  selector?: string;
  createdAt: string;
}

export interface ClipAttachmentRef {
  sourceUrl: string;
  suggestedName: string;
  alt?: string;
}

export interface ClipTarget {
  vaultId?: string;
  folder: string;
  noteName: string;
}

export type ClipPropertyValue = string | string[] | number;

export interface ClipPayload {
  version: typeof CLIP_PAYLOAD_VERSION;
  clipId: string;
  capturedAt: string;
  mode: ClipMode;
  templateId: string;
  behavior: ClipBehavior;
  target: ClipTarget;
  source: ClipSource;
  properties: Record<string, ClipPropertyValue>;
  tags: string[];
  body: string;
  contentHash: string;
  highlights?: ClipHighlight[];
  attachments?: ClipAttachmentRef[];
}

export type ClipAckStatus = "written" | "queued" | "rejected";

export type ClipError =
  | "unauthorized"
  | "too-large"
  | "invalid-path"
  | "vault-not-open"
  | "duplicate"
  | "invalid-payload"
  | "app-busy";

export interface ClipAck {
  clipId: string;
  status: ClipAckStatus;
  path?: string;
  error?: ClipError;
}
