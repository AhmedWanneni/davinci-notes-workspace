export interface WatcherChangeEvent {
  paths: string[];
}

export type WatcherUnlistenFn = () => void;

export interface WatcherAdapter {
  start(onChange: (event: WatcherChangeEvent) => void): Promise<WatcherUnlistenFn>;
  stop(): Promise<void>;
  setPaused(paused: boolean): Promise<void>;
}
