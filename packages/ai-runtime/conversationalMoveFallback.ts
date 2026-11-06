import type { AgentToolCall } from "@app/ai-api";
import { cleanPath, INVALID_WORDS } from "./conversationalPathUtils.js";

export function extractMoveToolCalls(
  prompt: string,
  text: string,
  folderName: string | null,
): AgentToolCall[] {
  const calls: AgentToolCall[] = [];
  const combined = `${prompt} ${text}`.trim();
  const addMove = (from: string, to: string) => {
    if (
      !calls.some(
        (c) => c.arguments.fromPath === from && c.arguments.toPath === to,
      )
    ) {
      calls.push({
        id: `call_conv_move_${Date.now()}_${calls.length}`,
        name: "move_note",
        arguments: { fromPath: from, toPath: to },
      });
    }
  };

  const explicitPattern =
    /(?:move|moved|put|place|placed|relocate)\s+(?:the\s+)?(?:note|file\s+)?["'‘“]?([a-zA-Z0-9_.-]+\.md|[a-zA-Z0-9_-]+)["'’”]?\s+(?:in|into|to|under)\s+(?:the\s+)?(?:folder|directory\s+)?["'‘“]?([a-zA-Z0-9_./-]+)["'’”]?/gi;
  let match: RegExpExecArray | null;
  while ((match = explicitPattern.exec(combined)) !== null) {
    const rawFrom = match[1]?.trim().replace(/^["'‘“]+|["'’”.,!]+$/g, "");
    const rawDest = match[2]?.trim().replace(/^["'‘“]+|["'’”.,!]+$/g, "");
    if (
      rawFrom &&
      rawDest &&
      !INVALID_WORDS.has(rawFrom.toLowerCase()) &&
      !INVALID_WORDS.has(rawDest.toLowerCase())
    ) {
      const fromPath = cleanPath(rawFrom);
      const destClean = cleanPath(rawDest, true);
      const toPath = destClean.endsWith(".md")
        ? destClean
        : `${destClean}/${fromPath.split("/").pop()}`;
      addMove(fromPath, toPath);
    }
  }

  if (calls.length === 0 && folderName) {
    const putInItPattern =
      /(?:put|move|place|relocate)\s+(?:the\s+)?(?:note|file\s+)?["'‘“]?([a-zA-Z0-9_.-]+\.md|[a-zA-Z0-9_-]+)["'’”]?\s+(?:in|into|under|to)\s+(?:it|the\s+folder|the\s+directory)/i;
    const itMatch = putInItPattern.exec(combined);
    const rawItFrom = itMatch?.[1]?.trim().replace(/^["'‘“]+|["'’”.,!]+$/g, "");
    if (rawItFrom && !INVALID_WORDS.has(rawItFrom.toLowerCase())) {
      const fromPath = cleanPath(rawItFrom);
      const toPath = `${folderName}/${fromPath.split("/").pop()}`;
      addMove(fromPath, toPath);
    }
  }
  return calls;
}
