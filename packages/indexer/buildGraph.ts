import type { Note } from "@app/core-types";

export interface GraphNode {
  id: string;
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphIndex {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  /** Target note path → source paths that link to it. */
  backlinks: Map<string, string[]>;
}

function createEmptyGraph(): GraphIndex {
  return {
    nodes: new Map(),
    edges: [],
    backlinks: new Map(),
  };
}

function ensureNode(graph: GraphIndex, note: Note): void {
  if (!graph.nodes.has(note.path)) {
    graph.nodes.set(note.path, { id: note.path, label: note.title });
  } else {
    const existing = graph.nodes.get(note.path)!;
    existing.label = note.title;
  }
}

function addBacklink(graph: GraphIndex, target: string, source: string): void {
  const existing = graph.backlinks.get(target) ?? [];
  if (!existing.includes(source)) {
    graph.backlinks.set(target, [...existing, source]);
  }
}

function removeBacklink(
  graph: GraphIndex,
  target: string,
  source: string,
): void {
  const existing = graph.backlinks.get(target);
  if (!existing) return;

  const next = existing.filter((path) => path !== source);
  if (next.length === 0) {
    graph.backlinks.delete(target);
  } else {
    graph.backlinks.set(target, next);
  }
}

function edgesForNote(note: Note): GraphEdge[] {
  return note.outlinks
    .filter((link) => link.resolved)
    .map((link) => ({ source: note.path, target: link.target }));
}

function removeOutgoingEdges(graph: GraphIndex, note: Note): void {
  graph.edges = graph.edges.filter((edge) => edge.source !== note.path);

  for (const link of note.outlinks) {
    if (link.resolved) {
      removeBacklink(graph, link.target, note.path);
    }
  }
}

function addNoteToGraph(graph: GraphIndex, note: Note): void {
  ensureNode(graph, note);

  for (const edge of edgesForNote(note)) {
    graph.edges.push(edge);
    addBacklink(graph, edge.target, edge.source);
    if (!graph.nodes.has(edge.target)) {
      graph.nodes.set(edge.target, {
        id: edge.target,
        label:
          edge.target.replace(/\.md$/i, "").split("/").pop() ?? edge.target,
      });
    }
  }
}

/** Build a full link graph and backlink index from parsed notes. */
export function buildGraph(notes: readonly Note[]): GraphIndex {
  const graph = createEmptyGraph();
  for (const note of notes) {
    addNoteToGraph(graph, note);
  }
  return graph;
}

/** Incrementally update the graph after a single note changes. */
export function updateGraphForNote(
  graph: GraphIndex,
  note: Note,
  previousNote?: Note,
): GraphIndex {
  if (previousNote) {
    removeOutgoingEdges(graph, previousNote);
  }
  addNoteToGraph(graph, note);
  return graph;
}
