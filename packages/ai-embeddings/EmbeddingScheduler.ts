import type { AIProvider } from "@app/ai-api";
import type { Note } from "@app/core-types";
import { EmbeddingIndex } from "./EmbeddingIndex";

/** Kept equal to the vault watcher settle boundary (desktop owns that constant). */
const DEFAULT_SETTLE_MS = 450;

export interface EmbeddingSchedulerOptions {
  provider: AIProvider;
  index: EmbeddingIndex;
  settleMs?: number;
  onUpdate?: (notes: readonly Note[]) => Promise<void>;
}

/** Uses the vault watcher's settled batch boundary; never runs in the edit call stack. */
export class EmbeddingScheduler {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private queued = new Map<string, Note>();

  constructor(private readonly options: EmbeddingSchedulerOptions) {}

  enqueue(notes: readonly Note[]): void {
    notes.forEach((note) => this.queued.set(note.path, note));
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(
      () => void this.flush(),
      this.options.settleMs ?? DEFAULT_SETTLE_MS,
    );
  }

  async flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const notes = [...this.queued.values()];
    this.queued.clear();
    if (notes.length === 0) return;
    await this.options.index.updateNotes(notes, this.options.provider);
    await this.options.onUpdate?.(notes);
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.queued.clear();
  }
}
