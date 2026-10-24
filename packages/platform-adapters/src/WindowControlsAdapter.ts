export interface WindowControlsAdapter {
  readonly supported: boolean;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  toggleFullscreen(): Promise<void>;
  isFullscreen(): Promise<boolean>;
  close(): Promise<void>;
  startDragging(): void;
}
