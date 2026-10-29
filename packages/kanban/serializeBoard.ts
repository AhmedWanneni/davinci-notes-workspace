import type { KanbanBoard } from "./kanbanTypes";

export function serializeBoard(board: KanbanBoard): string {
  if (!board.isModified && board.rawText !== undefined) {
    return board.rawText;
  }

  const parts: string[] = [];
  parts.push(...board.preambleLines);

  for (const lane of board.lanes) {
    parts.push(lane.headingLine);
    parts.push(...lane.preLines);
    for (const card of lane.cards) {
      parts.push(...card.preCardLines);
      parts.push(...card.rawLines);
    }
    parts.push(...lane.postLines);
  }

  parts.push(...board.epilogueLines);

  const joined = parts.join(board.lineEnding);
  return board.hasTrailingNewline ? joined + board.lineEnding : joined;
}
