import {
  CLIP_PAYLOAD_VERSION,
  type ClipAttachmentRef,
  type ClipHighlight,
  type ClipMode,
  type ClipPayload,
  type ClipSource,
} from "./ClipPayload.js";
import type { ClipTemplate } from "./ClipTemplate.js";
import type { RenderedClip } from "./renderClipTemplate.js";

export interface BuildClipPayloadInput {
  template: ClipTemplate;
  rendered: RenderedClip;
  source: ClipSource;
  mode: ClipMode;
  /** Supplied by the caller so output is deterministic in tests. */
  clipId: string;
  capturedAt: string;
  vaultId?: string;
  highlights?: ClipHighlight[];
  attachments?: ClipAttachmentRef[];
}

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const UINT64_MASK = 0xffffffffffffffffn;

/**
 * Non-cryptographic content hash for clip dedupe (ADR-0178).
 *
 * It only needs to be stable across extension/desktop and cheap; it is not a
 * security boundary, so FNV-1a beats pulling in a crypto dependency.
 */
export function contentHash(content: string): string {
  let hash = FNV_OFFSET;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= BigInt(content.charCodeAt(index));
    hash = (hash * FNV_PRIME) & UINT64_MASK;
  }
  return hash.toString(16).padStart(16, "0");
}

export function buildClipPayload(input: BuildClipPayloadInput): ClipPayload {
  const { rendered, template } = input;
  const payload: ClipPayload = {
    version: CLIP_PAYLOAD_VERSION,
    clipId: input.clipId,
    capturedAt: input.capturedAt,
    mode: input.mode,
    templateId: template.id,
    behavior: template.behavior,
    target: {
      vaultId: input.vaultId,
      folder: rendered.folder,
      noteName: rendered.noteName,
    },
    source: input.source,
    properties: rendered.properties,
    tags: rendered.tags,
    body: rendered.body,
    contentHash: contentHash(rendered.body),
  };

  if (input.highlights && input.highlights.length > 0) {
    payload.highlights = input.highlights;
  }
  if (input.attachments && input.attachments.length > 0) {
    payload.attachments = input.attachments;
  }
  return payload;
}
