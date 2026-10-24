import type { ClipMode } from "@app/clipper-core";
import type { PageCapture } from "../capture/readPage";

/**
 * What a clip covers before the user picks: whatever they had selected, else the
 * whole page. A whitespace-only selection is not a selection.
 */
export function defaultClipMode(capture: PageCapture): ClipMode {
  return capture.selection && capture.selection.trim().length > 0
    ? "selection"
    : "full";
}
