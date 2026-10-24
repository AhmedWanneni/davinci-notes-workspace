import { useWorkspaceStore } from "../state/useWorkspaceStore";
import type { WorkspaceSaveUpdater } from "./noteConflictTypes";
import { writeAndIndexNote } from "./performSaveNote";
import { queuePerPath } from "./saveQueue";
import { readNote, statNote } from "./vaultCommands";

/** Where a clip lands relative to the note's existing body. */
export type ClipInsertPosition = "top" | "bottom";

/** A frontmatter block at the very start of a note, if there is one. */
const LEADING_FRONTMATTER = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*\r?\n/;
const TRAILING_EOL_RUN = /(?:\r\n|\n)+$/;
const LEADING_EOL_RUN = /^(?:\r\n|\n)+/;

/**
 * Join two blocks with exactly one blank line at the seam.
 *
 * Only *runs of line breaks* are normalised: every other character of the
 * existing note survives, so an append can never truncate it.
 */
function joinBlocks(above: string, below: string, eol: string): string {
  if (above.length === 0) return below;
  if (below.length === 0) return above;
  return [
    above.replace(TRAILING_EOL_RUN, ""),
    below.replace(LEADING_EOL_RUN, ""),
  ].join(`${eol}${eol}`);
}

/**
 * `top` insertion point: past a leading frontmatter block, when there is one, so
 * a prepend lands in the body instead of splitting the note's properties.
 */
function findBodyStart(content: string): number {
  const match = LEADING_FRONTMATTER.exec(content);
  return match ? match[0].length : 0;
}

/**
 * Compose the note's next content for an insert.
 *
 * The clip arrives with its own frontmatter stripped by the caller: appending a
 * second `---…---` block into the middle of a note would be literal text, not
 * properties (the note already has its own block, and only `create` writes one).
 *
 * With frontmatter present there is always exactly one blank line between the
 * block and the content, so a `top` insert never lands inside the properties.
 */
export function mergeIntoNote(
  existing: string,
  clipBody: string,
  position: ClipInsertPosition,
  eol: string,
): string {
  if (existing.length === 0) return clipBody;
  if (position === "bottom") return joinBlocks(existing, clipBody, eol);

  const headEnd = findBodyStart(existing);
  if (headEnd === 0) return joinBlocks(clipBody, existing, eol);

  const head = existing.slice(0, headEnd);
  const tail = existing.slice(headEnd);
  const body = tail.length === 0 ? clipBody : joinBlocks(clipBody, tail, eol);
  return `${head}${eol}${body}`;
}

async function readExistingContent(
  path: string,
  buffered: string | undefined,
): Promise<string> {
  // An open note's in-memory buffer wins: appending to the buffer keeps unsaved
  // edits and avoids the save-time conflict guard firing on our own write.
  if (buffered !== undefined) return buffered;
  const stat = await statNote(path);
  return stat.exists ? (await readNote(path)).content : "";
}

/**
 * Append (or prepend) a rendered clip to the note at `path`, through the
 * canonical vault write path (ADR-0177) — never a second write path.
 *
 * A note that does not exist is **created** with the clip as its content: there
 * is nothing to truncate, and a clip that survived the extension must survive
 * the desktop (ADR-0176). The note's own line ending is preserved.
 */
export async function appendToNoteInVault(
  path: string,
  clipBody: string,
  position: ClipInsertPosition = "bottom",
): Promise<string> {
  return queuePerPath(path, async () => {
    const store = useWorkspaceStore.getState();
    const existing = await readExistingContent(path, store.notesContent[path]);
    const eol = existing.includes("\r\n") ? "\r\n" : "\n";
    const merged = mergeIntoNote(existing, clipBody, position, eol);
    const allNotePaths = store.allNotePaths.includes(path)
      ? store.allNotePaths
      : [...store.allNotePaths, path];

    await writeAndIndexNote(
      path,
      merged,
      { allNotePaths, graph: store.graph, tagIndex: store.tagIndex },
      // The live store state carries every `WorkspaceSaveContext` field
      // (`vaultUpdateCounter` is initialised in the store) but the interface
      // does not declare them all, so the canonical writer's setter type is not
      // structurally satisfiable from outside the store.
      useWorkspaceStore.setState as WorkspaceSaveUpdater,
    );

    useWorkspaceStore.setState((current) => ({
      allNotePaths: current.allNotePaths.includes(path)
        ? current.allNotePaths
        : [...current.allNotePaths, path],
      notesContent: { ...current.notesContent, [path]: merged },
    }));

    return path;
  });
}
