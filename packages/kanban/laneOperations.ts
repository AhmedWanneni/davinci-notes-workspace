import type { KanbanBoard, KanbanLane } from "./kanbanTypes";

export function addLane(
  board: KanbanBoard,
  title: string,
  targetIndex?: number,
): KanbanBoard {
  const newLane: KanbanLane = {
    id: `lane-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    headingLine: `## ${title}`,
    preLines: [],
    cards: [],
    postLines: board.lanes.length > 0 ? [""] : [],
  };

  const idx =
    targetIndex === undefined ||
    targetIndex < 0 ||
    targetIndex > board.lanes.length
      ? board.lanes.length
      : targetIndex;

  board.lanes.splice(idx, 0, newLane);
  board.isModified = true;
  return board;
}

export function renameLane(
  board: KanbanBoard,
  laneId: string,
  newTitle: string,
): KanbanBoard {
  const lane = board.lanes.find((l) => l.id === laneId);
  if (!lane) return board;

  lane.title = newTitle;
  lane.headingLine = `## ${newTitle}`;
  board.isModified = true;
  return board;
}

export function deleteLane(board: KanbanBoard, laneId: string): KanbanBoard {
  const idx = board.lanes.findIndex((l) => l.id === laneId);
  if (idx === -1) return board;

  board.lanes.splice(idx, 1);
  board.isModified = true;
  return board;
}

export function reorderLanes(
  board: KanbanBoard,
  laneIds: string[],
): KanbanBoard {
  const laneMap = new Map<string, KanbanLane>();
  for (const lane of board.lanes) {
    laneMap.set(lane.id, lane);
  }

  const nextLanes: KanbanLane[] = [];
  for (const id of laneIds) {
    const lane = laneMap.get(id);
    if (lane) {
      nextLanes.push(lane);
      laneMap.delete(id);
    }
  }

  // Preserve any unmentioned lanes at the end
  for (const remaining of laneMap.values()) {
    nextLanes.push(remaining);
  }

  board.lanes = nextLanes;
  board.isModified = true;
  return board;
}
