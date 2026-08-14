/** Grid cell size — matches Background gap in CanvasView. */
export const CANVAS_SNAP_GRID: [number, number] = [24, 24];

/** Pixel threshold for snapping edges/centers to other cards. */
export const CANVAS_ALIGN_THRESHOLD = 8;

export const DEFAULT_TEXT_CARD_WIDTH = 250;
export const DEFAULT_TEXT_CARD_HEIGHT = 120;
export const MIN_TEXT_CARD_WIDTH = 80;
export const MIN_TEXT_CARD_HEIGHT = 48;

export function createTextCardId(): string {
  return `text-${crypto.randomUUID()}`;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
