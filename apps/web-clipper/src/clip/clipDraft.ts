import type { ClipPayload, ClipPropertyValue } from "@app/clipper-core";
import type { ClipEdits } from "./applyClipEdits";

/**
 * What the edit fields show.
 *
 * Kept apart from the payload because the two have different jobs: a field shows
 * the user's raw typing (so it can be typed into freely), while the payload is what
 * those edits sanitise to and is what actually gets written.
 */
export interface ClipDraft {
  noteName: string;
  folder: string;
  properties: Readonly<Record<string, ClipPropertyValue>>;
}

export const EMPTY_CLIP_DRAFT: ClipDraft = {
  noteName: "",
  folder: "",
  properties: {},
};

/** Layer hand edits over a rendered clip to get the values the fields display. */
export function buildClipDraft(
  payload: ClipPayload,
  edits: ClipEdits,
): ClipDraft {
  const properties: Record<string, ClipPropertyValue> = {
    ...payload.properties,
  };

  for (const [name, value] of Object.entries(edits.properties ?? {})) {
    properties[name] = value;
  }

  return {
    noteName: edits.noteName ?? payload.target.noteName,
    folder: edits.folder ?? payload.target.folder,
    properties,
  };
}
