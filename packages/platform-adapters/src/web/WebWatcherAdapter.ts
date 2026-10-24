import type {
  WatcherAdapter,
  WatcherChangeEvent,
  WatcherUnlistenFn,
} from "../WatcherAdapter";

export class WebWatcherAdapter implements WatcherAdapter {
  private readonly listeners = new Set<(event: WatcherChangeEvent) => void>();
  private readonly pendingPaths = new Set<string>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private paused = false;
  private readonly debounceMs: number;

  constructor(debounceMs = 400) {
    this.debounceMs = debounceMs;
  }

  async start(
    onChange: (event: WatcherChangeEvent) => void,
  ): Promise<WatcherUnlistenFn> {
    this.listeners.add(onChange);
    return () => {
      this.listeners.delete(onChange);
    };
  }

  async stop(): Promise<void> {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingPaths.clear();
    this.listeners.clear();
  }

  async setPaused(paused: boolean): Promise<void> {
    this.paused = paused;
    if (paused && this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.pendingPaths.clear();
    }
  }

  notifyChanged(paths: string[]): void {
    if (this.paused || paths.length === 0) return;

    for (const path of paths) {
      this.pendingPaths.add(path);
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.paused || this.pendingPaths.size === 0) return;

      const batch = [...this.pendingPaths];
      this.pendingPaths.clear();

      for (const listener of this.listeners) {
        listener({ paths: batch });
      }
    }, this.debounceMs);
  }
}
