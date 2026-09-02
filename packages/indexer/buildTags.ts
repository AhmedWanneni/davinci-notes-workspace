import type { Note, Tag } from "@app/core-types";

export interface TagIndex {
  /** Tag key -> Map of note path -> { display, mtime }. */
  tagToNotes: Map<string, Map<string, { display: string; mtime: number }>>;
  /** Note path -> set of tag keys it contains. */
  noteToTags: Map<string, Set<string>>;
}

export function createEmptyTagIndex(): TagIndex {
  return {
    tagToNotes: new Map(),
    noteToTags: new Map(),
  };
}

/** Get the canonical display casing for a tag based on the oldest note containing it. */
export function getCanonicalDisplay(
  index: TagIndex,
  tagKey: string,
): string | undefined {
  const usages = index.tagToNotes.get(tagKey);
  if (!usages || usages.size === 0) return undefined;

  let oldestMtime = Infinity;
  let canonicalDisplay = "";

  for (const { display, mtime } of usages.values()) {
    if (mtime < oldestMtime) {
      oldestMtime = mtime;
      canonicalDisplay = display;
    }
  }

  return canonicalDisplay;
}

/**
 * Remove a note's tags from the index.
 */
export function removeNoteFromTagIndex(index: TagIndex, path: string): void {
  const tagKeys = index.noteToTags.get(path);
  if (!tagKeys) return;

  for (const key of tagKeys) {
    const usages = index.tagToNotes.get(key);
    if (usages) {
      usages.delete(path);
      if (usages.size === 0) {
        index.tagToNotes.delete(key);
      }
    }
  }

  index.noteToTags.delete(path);
}

/** Add or update a note's tags in the index. */
export function updateTagIndexForNote(index: TagIndex, note: Note): void {
  // 1. Remove previous entries for this note
  removeNoteFromTagIndex(index, note.path);

  // 2. Add new entries
  const tagKeys = new Set<string>();
  for (const tag of note.tags.all) {
    const key = tag.key;
    tagKeys.add(key);

    // Map tag to note with its specific casing and mtime
    let usages = index.tagToNotes.get(key);
    if (!usages) {
      usages = new Map();
      index.tagToNotes.set(key, usages);
    }
    usages.set(note.path, { display: tag.display, mtime: note.mtime });
  }

  index.noteToTags.set(note.path, tagKeys);
}

/** Build a full tag index from a list of notes. */
export function buildTagIndex(notes: readonly Note[]): TagIndex {
  const index = createEmptyTagIndex();
  for (const note of notes) {
    updateTagIndexForNote(index, note);
  }
  return index;
}

/**
 * Query the index for a tag and its descendants.
 * @param tagKey The canonical key of the tag (without #).
 * @returns Set of note paths.
 */
export function queryNotesByTag(index: TagIndex, tagKey: string): Set<string> {
  const results = new Set<string>();
  const normalizedQuery = tagKey.toLowerCase();

  for (const [key, usages] of index.tagToNotes.entries()) {
    // Exact match or descendant (e.g. "inbox/to-read" starts with "inbox/")
    if (key === normalizedQuery || key.startsWith(`${normalizedQuery}/`)) {
      for (const path of usages.keys()) {
        results.add(path);
      }
    }
  }

  return results;
}

/** Returns all unique tag keys currently in the index. */
export function getAllTagKeys(index: TagIndex): string[] {
  return Array.from(index.tagToNotes.keys());
}

/** Returns a Tag object with the vault-wide canonical casing. */
export function getCanonicalTag(
  index: TagIndex,
  tagKey: string,
): Tag | undefined {
  const display = getCanonicalDisplay(index, tagKey);
  if (!display) return undefined;

  return {
    key: tagKey,
    display,
    segments: display.slice(1).split("/"),
  };
}
