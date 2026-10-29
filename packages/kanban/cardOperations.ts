import type { KanbanBoard, KanbanCard } from "./kanbanTypes";

function findCardLocation(
  board: KanbanBoard,
  cardId: string,
): { laneIndex: number; cardIndex: number; card: KanbanCard } | null {
  for (let l = 0; l < board.lanes.length; l += 1) {
    const lane = board.lanes[l];
    for (let c = 0; c < lane.cards.length; c += 1) {
      if (lane.cards[c].id === cardId) {
        return { laneIndex: l, cardIndex: c, card: lane.cards[c] };
      }
    }
  }
  return null;
}

export function moveCard(
  board: KanbanBoard,
  cardId: string,
  targetLaneId: string,
  targetIndex?: number,
): KanbanBoard {
  const loc = findCardLocation(board, cardId);
  if (!loc) return board;

  const targetLane = board.lanes.find((lane) => lane.id === targetLaneId);
  if (!targetLane) return board;

  const sourceLane = board.lanes[loc.laneIndex];
  const [card] = sourceLane.cards.splice(loc.cardIndex, 1);

  const idx =
    targetIndex === undefined ||
    targetIndex < 0 ||
    targetIndex > targetLane.cards.length
      ? targetLane.cards.length
      : targetIndex;

  targetLane.cards.splice(idx, 0, card);
  board.isModified = true;
  return board;
}

export function editCard(
  board: KanbanBoard,
  cardId: string,
  newTitle: string,
  newBody?: string,
): KanbanBoard {
  const loc = findCardLocation(board, cardId);
  if (!loc) return board;

  const { card } = loc;
  card.title = newTitle;
  const marker = card.completed ? "x" : " ";
  card.rawLines[0] = `- [${marker}] ${newTitle}`;

  if (newBody !== undefined) {
    card.body = newBody;
    const indent = card.indent || "\t";
    if (newBody.trim().length > 0) {
      const indented = newBody
        .split(/\r?\n/)
        .map((line) => (line ? `${indent}${line}` : ""));
      card.rawLines = [card.rawLines[0], ...indented];
    } else {
      card.rawLines = [card.rawLines[0]];
    }
  }

  board.isModified = true;
  return board;
}

export function toggleCard(board: KanbanBoard, cardId: string): KanbanBoard {
  const loc = findCardLocation(board, cardId);
  if (!loc) return board;

  const { card } = loc;
  card.completed = !card.completed;
  const marker = card.completed ? "x" : " ";
  card.rawLines[0] = card.rawLines[0].replace(
    /^- \[([- xX])\]/,
    `- [${marker}]`,
  );

  board.isModified = true;
  return board;
}

export function addCard(
  board: KanbanBoard,
  laneId: string,
  title: string,
  body = "",
  targetIndex?: number,
): KanbanBoard {
  const lane = board.lanes.find((l) => l.id === laneId);
  if (!lane) return board;

  const indent = lane.cards[0]?.indent || "\t";
  const marker = " ";
  const header = `- [${marker}] ${title}`;
  const rawLines = [header];

  if (body.trim().length > 0) {
    for (const bLine of body.split(/\r?\n/)) {
      rawLines.push(bLine ? `${indent}${bLine}` : "");
    }
  }

  const newCard: KanbanCard = {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    completed: false,
    indent,
    rawLines,
    preCardLines: [],
  };

  const idx =
    targetIndex === undefined ||
    targetIndex < 0 ||
    targetIndex > lane.cards.length
      ? lane.cards.length
      : targetIndex;

  lane.cards.splice(idx, 0, newCard);
  board.isModified = true;
  return board;
}

export function deleteCard(board: KanbanBoard, cardId: string): KanbanBoard {
  const loc = findCardLocation(board, cardId);
  if (!loc) return board;

  board.lanes[loc.laneIndex].cards.splice(loc.cardIndex, 1);
  board.isModified = true;
  return board;
}
