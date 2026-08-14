import type { CanvasData } from "./CanvasData";
import { validateCanvas } from "./validateCanvas";

export interface SerializeCanvasOptions {
  /** Pretty-print indentation space count. Defaults to 2. */
  indent?: number;
}

/**
 * Validates and serializes a CanvasData object into a formatted JSON string.
 */
export function serializeCanvas(
  data: CanvasData,
  options?: SerializeCanvasOptions,
): string {
  const validated = validateCanvas(data);
  const indent = options?.indent ?? 2;
  return JSON.stringify(validated, null, indent);
}
