/** Grid cell size — matches Background gap in CanvasView. */
export const CANVAS_SNAP_GRID: [number, number] = [24, 24];

/** Pixel threshold for snapping edges/centers to other cards. */
export const CANVAS_ALIGN_THRESHOLD = 8;

export const DEFAULT_TEXT_CARD_WIDTH = 168;
export const DEFAULT_TEXT_CARD_HEIGHT = 48;
export const MIN_TEXT_CARD_WIDTH = 48;
export const MIN_TEXT_CARD_HEIGHT = 28;

export const DEFAULT_FILE_CARD_WIDTH = 240;
export const DEFAULT_FILE_CARD_HEIGHT = 168;
export const MIN_FILE_CARD_WIDTH = 96;
export const MIN_FILE_CARD_HEIGHT = 64;

export const DEFAULT_GROUP_WIDTH = 312;
export const DEFAULT_GROUP_HEIGHT = 216;

export const DEFAULT_LINK_CARD_WIDTH = 240;
export const DEFAULT_LINK_CARD_HEIGHT = 168;
export const MIN_LINK_CARD_WIDTH = 96;
export const MIN_LINK_CARD_HEIGHT = 64;

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

