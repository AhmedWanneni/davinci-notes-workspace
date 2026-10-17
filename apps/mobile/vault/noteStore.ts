import { useSyncExternalStore } from "react";

export interface NoteIdentity {
  id: string;
  path: string;
}

class NoteStore {
  private pathById = new Map<string, string>();
  private idByPath = new Map<string, string>();
  private listeners = new Set<() => void>();

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Registers a note path with a stable ID.
   * If already registered, returns the existing ID.
   */
  register(path: string, preferredId?: string): string {
    const normalized = path.replace(/\\/g, "/");
    const existingId = this.idByPath.get(normalized);
    if (existingId) return existingId;

    const id =
      preferredId ??
      `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    this.pathById.set(id, normalized);
    this.idByPath.set(normalized, id);
    this.notify();
    return id;
  }

  /**
   * Resolves the current path for a stable note ID.
   */
  getPath(id: string): string | null {
    return this.pathById.get(id) ?? null;
  }

  /**
   * Resolves the stable ID for a path, or null if not yet registered.
   */
  getId(path: string): string | null {
    return this.idByPath.get(path.replace(/\\/g, "/")) ?? null;
  }

  /**
   * Updates note path upon rename. All screens in the stack holding the noteId
   * will reactively resolve the new path.
   */
  rename(oldPath: string, newPath: string): void {
    const normOld = oldPath.replace(/\\/g, "/");
    const normNew = newPath.replace(/\\/g, "/");
    if (normOld === normNew) return;

    let id = this.idByPath.get(normOld);
    if (!id) {
      id = this.register(normOld);
    }

    this.idByPath.delete(normOld);
    this.pathById.set(id, normNew);
    this.idByPath.set(normNew, id);
    this.notify();
  }

  /**
   * Removes a note from the store upon deletion.
   */
  remove(pathOrId: string): void {
    const id = this.pathById.has(pathOrId)
      ? pathOrId
      : this.idByPath.get(pathOrId.replace(/\\/g, "/"));
    if (!id) return;

    const currentPath = this.pathById.get(id);
    this.pathById.delete(id);
    if (currentPath) {
      this.idByPath.delete(currentPath);
    }
    this.notify();
  }

  /**
   * Clears all registrations (for testing or vault reset).
   */
  clear(): void {
    this.pathById.clear();
    this.idByPath.clear();
    this.notify();
  }
}

export const defaultNoteStore = new NoteStore();

/**
 * Hook to reactively observe a note's current path by its stable ID.
 */
export function useNotePath(noteId?: string, fallbackPath?: string): string {
  const resolved = useSyncExternalStore(
    defaultNoteStore.subscribe,
    () => (noteId ? defaultNoteStore.getPath(noteId) : null),
    () => (noteId ? defaultNoteStore.getPath(noteId) : null),
  );

  return resolved ?? fallbackPath ?? "";
}
