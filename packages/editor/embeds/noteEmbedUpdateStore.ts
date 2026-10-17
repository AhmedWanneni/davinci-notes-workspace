export type NoteUpdateListener = (path: string, newContent?: string) => void;

class NoteEmbedUpdateEmitter {
  private listeners = new Set<NoteUpdateListener>();

  subscribe(listener: NoteUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(path: string, newContent?: string): void {
    for (const listener of this.listeners) {
      try {
        listener(path, newContent);
      } catch (err) {
        // Ignore subscriber failures to protect the host document
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const noteEmbedUpdateEmitter = new NoteEmbedUpdateEmitter();

export function notifyNoteEmbedUpdate(path: string, newContent?: string): void {
  noteEmbedUpdateEmitter.notify(path, newContent);
}
