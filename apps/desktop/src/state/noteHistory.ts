export interface NoteHistory {
  paths: string[];
  index: number;
}

export const emptyNoteHistory: NoteHistory = { paths: [], index: -1 };

export function pushNoteHistory(
  history: NoteHistory,
  path: string,
): NoteHistory {
  if (history.paths[history.index] === path) return history;
  const paths = [...history.paths.slice(0, history.index + 1), path];
  return { paths, index: paths.length - 1 };
}

export function moveNoteHistory(
  history: NoteHistory,
  offset: number,
): NoteHistory {
  return {
    ...history,
    index: Math.max(
      0,
      Math.min(history.paths.length - 1, history.index + offset),
    ),
  };
}

export function renameNoteHistory(
  history: NoteHistory,
  from: string,
  to: string,
): NoteHistory {
  const prefix = `${from}/`;
  return {
    ...history,
    paths: history.paths.map((path) =>
      path === from
        ? to
        : path.startsWith(prefix)
          ? `${to}/${path.slice(prefix.length)}`
          : path,
    ),
  };
}
