/** Grid cell size — matches Background gap in CanvasView. */
export const CANVAS_SNAP_GRID: [number, number] = [24, 24];

/** Pixel threshold for snapping edges/centers to other cards. */
export const CANVAS_ALIGN_THRESHOLD = 8;

export const DEFAULT_TEXT_CARD_WIDTH = 216;
export const DEFAULT_TEXT_CARD_HEIGHT = 72;
export const MIN_TEXT_CARD_WIDTH = 60;
export const MIN_TEXT_CARD_HEIGHT = 36;

export const DEFAULT_FILE_CARD_WIDTH = 288;
export const DEFAULT_FILE_CARD_HEIGHT = 216;
export const MIN_FILE_CARD_WIDTH = 120;
export const MIN_FILE_CARD_HEIGHT = 80;

export const DEFAULT_GROUP_WIDTH = 360;
export const DEFAULT_GROUP_HEIGHT = 264;

export const DEFAULT_LINK_CARD_WIDTH = 312;
export const DEFAULT_LINK_CARD_HEIGHT = 216;
export const MIN_LINK_CARD_WIDTH = 120;
export const MIN_LINK_CARD_HEIGHT = 80;

export function createTextCardId(): string {
  return `text-${crypto.randomUUID()}`;
}

export function createFileCardId(): string {
  return `file-${crypto.randomUUID()}`;
}

export function createGroupId(): string {
  return `group-${crypto.randomUUID()}`;
}

export function createLinkCardId(): string {
  return `link-${crypto.randomUUID()}`;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

