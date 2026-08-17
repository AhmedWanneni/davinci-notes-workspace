import type { CanvasData } from "../CanvasData";
import type { CanvasEdge } from "../CanvasEdge";
import type { CanvasNode } from "../CanvasNode";

export interface GenerateCanvasOptions {
  numTextNodes?: number;
  numFileNodes?: number;
  numImageNodes?: number;
  numVideoNodes?: number;
  numGroupNodes?: number;
  numEdges?: number;
  columns?: number;
  colSpacing?: number;
  rowSpacing?: number;
}

export function generateLargeCanvas(options: GenerateCanvasOptions = {}): CanvasData {
  const {
    numTextNodes = 50,
    numFileNodes = 30,
    numImageNodes = 20,
    numVideoNodes = 10,
    numGroupNodes = 10,
    numEdges = 130,
    columns = 10,
    colSpacing = 400,
    rowSpacing = 320,
  } = options;

  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  let nodeIndex = 0;

  // 1. Generate Group Nodes first (bounding regions)
  for (let g = 0; g < numGroupNodes; g++) {
    const col = (g * 2) % columns;
    const row = Math.floor((g * 2) / columns) * 2;
    nodes.push({
      id: `group-${g + 1}`,
      type: "group",
      label: `Group Section ${g + 1}`,
      x: col * colSpacing - 30,
      y: row * rowSpacing - 40,
      width: colSpacing * 2 + 60,
      height: rowSpacing * 2 + 60,
      color: String(((g % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6),
    });
  }

  // 2. Generate Text Cards
  for (let t = 0; t < numTextNodes; t++) {
    const col = nodeIndex % columns;
    const row = Math.floor(nodeIndex / columns);
    nodes.push({
      id: `text-${t + 1}`,
      type: "text",
      text: `### Topic Note ${t + 1}\n\nDetailed exploration of concept ${t + 1}.\n- Item A\n- Item B\n\n[[Notes/Topic-${((t + 3) % 20) + 1}]]`,
      x: col * colSpacing,
      y: row * rowSpacing,
      width: 320,
      height: 220,
      color: String(((t % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6),
    });
    nodeIndex++;
  }

  // 3. Generate Markdown File Embed Cards
  for (let f = 0; f < numFileNodes; f++) {
    const col = nodeIndex % columns;
    const row = Math.floor(nodeIndex / columns);
    nodes.push({
      id: `file-md-${f + 1}`,
      type: "file",
      file: `Notes/Documentation-${f + 1}.md`,
      subpath: f % 3 === 0 ? `#section-${f + 1}` : undefined,
      x: col * colSpacing,
      y: row * rowSpacing,
      width: 340,
      height: 240,
      color: String(((f % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6),
    });
    nodeIndex++;
  }

  // 4. Generate Image File Embed Cards
  const imageExts = [".png", ".jpg", ".webp", ".svg"];
  for (let i = 0; i < numImageNodes; i++) {
    const col = nodeIndex % columns;
    const row = Math.floor(nodeIndex / columns);
    const ext = imageExts[i % imageExts.length];
    nodes.push({
      id: `file-img-${i + 1}`,
      type: "file",
      file: `attachments/diagram-${i + 1}${ext}`,
      x: col * colSpacing,
      y: row * rowSpacing,
      width: 360,
      height: 260,
    });
    nodeIndex++;
  }

  // 5. Generate Video File Embed Cards
  for (let v = 0; v < numVideoNodes; v++) {
    const col = nodeIndex % columns;
    const row = Math.floor(nodeIndex / columns);
    nodes.push({
      id: `file-vid-${v + 1}`,
      type: "file",
      file: `attachments/demo-recording-${v + 1}.mp4`,
      x: col * colSpacing,
      y: row * rowSpacing,
      width: 380,
      height: 280,
    });
    nodeIndex++;
  }

  // 6. Generate Edges connecting nodes
  const nonGroupNodes = nodes.filter((n) => n.type !== "group");
  const sides = ["top", "right", "bottom", "left"] as const;

  for (let e = 0; e < numEdges; e++) {
    const srcIndex = e % nonGroupNodes.length;
    const tgtIndex = (e + 3 + Math.floor(e / 5)) % nonGroupNodes.length;
    if (srcIndex === tgtIndex) continue;

    const fromSide = sides[e % sides.length];
    const toSide = sides[(e + 2) % sides.length];

    edges.push({
      id: `edge-${e + 1}`,
      fromNode: nonGroupNodes[srcIndex].id,
      fromSide,
      fromEnd: "none",
      toNode: nonGroupNodes[tgtIndex].id,
      toSide,
      toEnd: "arrow",
      label: e % 4 === 0 ? `relates to ${e + 1}` : undefined,
      color: e % 3 === 0 ? String(((e % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6) : undefined,
    });
  }

  return { nodes, edges };
}
