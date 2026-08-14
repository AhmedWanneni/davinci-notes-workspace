import type { CanvasData } from "./CanvasData";
import { validateCanvas } from "./validateCanvas";

/**
 * Parses and validates a JSON Canvas 1.0 document string.
 *
 * @throws {SyntaxError} If the string is not valid JSON.
 * @throws {Error} If the parsed JSON does not conform to the JSON Canvas specification.
 */
export function parseCanvas(jsonString: string): CanvasData {
  if (!jsonString || !jsonString.trim()) {
    return { nodes: [], edges: [] };
  }

  const parsed = JSON.parse(jsonString);
  return validateCanvas(parsed);
}
