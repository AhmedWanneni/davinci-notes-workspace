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

  const oldTitle = lane.title;
  lane.title = newTitle;
  lane.headingLine = `## ${newTitle}`;

  if (lane.color) {
    board.epilogueLines = updateEpilogueSettings(
      board.epilogueLines,
      (settings) => {
        const colors = settings["lane-colors"] as
          | Record<string, string>
          | undefined;
        if (colors && colors[oldTitle]) {
          colors[newTitle] = colors[oldTitle];
          delete colors[oldTitle];
        }
      },
    );
  }

  board.isModified = true;
  return board;
}

export function deleteLane(board: KanbanBoard, laneId: string): KanbanBoard {
  const idx = board.lanes.findIndex((l) => l.id === laneId);
  if (idx === -1) return board;

  const deleted = board.lanes[idx];
  board.lanes.splice(idx, 1);

  if (deleted?.color) {
    board.epilogueLines = updateEpilogueSettings(
      board.epilogueLines,
      (settings) => {
        const colors = settings["lane-colors"] as
          | Record<string, string>
          | undefined;
        if (colors && colors[deleted.title]) {
          delete colors[deleted.title];
          if (Object.keys(colors).length === 0) {
            delete settings["lane-colors"];
          }
        }
      },
    );
  }

  board.isModified = true;
  return board;
}

export function setLaneColor(
  board: KanbanBoard,
  laneId: string,
  color?: string,
): KanbanBoard {
  const lane = board.lanes.find((l) => l.id === laneId);
  if (!lane) return board;

  lane.color = color;
  board.epilogueLines = updateEpilogueSettings(
    board.epilogueLines,
    (settings) => {
      const colors = (settings["lane-colors"] =
        (settings["lane-colors"] as Record<string, string>) || {});
      if (color) {
        colors[lane.title] = color;
      } else {
        delete colors[lane.title];
        if (Object.keys(colors).length === 0) {
          delete settings["lane-colors"];
        }
      }
    },
  );
  board.isModified = true;
  return board;
}

function updateEpilogueSettings(
  epilogueLines: string[],
  updater: (settings: Record<string, unknown>) => void,
): string[] {
  const fullText = epilogueLines.join("\n");
  const match = fullText.match(/%%\s*kanban:settings\s*([\s\S]*?)%%/);

  let settings: Record<string, unknown> = { "kanban-plugin": "board" };
  if (match) {
    const rawBody = match[1].replace(/```(?:json)?|```/g, "").trim();
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed && typeof parsed === "object") settings = parsed;
    } catch {
      // Keep default
    }
  }

  updater(settings);

  const block = `%% kanban:settings\n\`\`\`json\n${JSON.stringify(settings, null, 2)}\n\`\`\`\n%%`;

  if (match) {
    const replaced = fullText.replace(
      /%%\s*kanban:settings[\s\S]*?%%/,
      block,
    );
    return replaced.split("\n");
  }

  const lines = [...epilogueLines];
  if (lines.length > 0 && lines[lines.length - 1] !== "") {
    lines.push("");
  }
  lines.push(...block.split("\n"));
  return lines;
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
