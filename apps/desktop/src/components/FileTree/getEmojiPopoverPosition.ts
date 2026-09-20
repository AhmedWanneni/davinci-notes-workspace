const PICKER_WIDTH = 320;
const PICKER_HEIGHT = 390;
const VIEWPORT_GUTTER = 12;

export function getEmojiPopoverPosition(x: number, y: number) {
  return {
    left: Math.max(
      VIEWPORT_GUTTER,
      Math.min(x, window.innerWidth - PICKER_WIDTH - VIEWPORT_GUTTER),
    ),
    top: Math.max(
      VIEWPORT_GUTTER,
      Math.min(y, window.innerHeight - PICKER_HEIGHT - VIEWPORT_GUTTER),
    ),
  };
}
