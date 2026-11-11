import { getBezierPath, Position } from "@xyflow/react";

export interface CanvasEdgePathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
}

/**
 * Calculates a smooth cubic bezier path for canvas edges.
 * When an edge backs up (e.g. source Right -> target Left where target is behind source),
 * standard XYFlow bezier collapses into an overlapping flat line. This helper produces
 * a graceful arc around the cards so the arrow never overlaps itself or clips.
 */
export function getCanvasEdgePath(params: CanvasEdgePathParams): [
  edgePath: string,
  labelX: number,
  labelY: number,
] {
  const { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition } =
    params;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  const isHorizontalBacking =
    (sourcePosition === Position.Right &&
      targetPosition === Position.Left &&
      dx <= 0) ||
    (sourcePosition === Position.Left &&
      targetPosition === Position.Right &&
      dx >= 0);

  const isVerticalBacking =
    (sourcePosition === Position.Bottom &&
      targetPosition === Position.Top &&
      dy <= 0) ||
    (sourcePosition === Position.Top &&
      targetPosition === Position.Bottom &&
      dy >= 0);

  if (isHorizontalBacking) {
    const dir = sourcePosition === Position.Right ? 1 : -1;
    const absDx = Math.abs(dx);
    const arcHeight = Math.max(50, Math.min(120, absDx * 0.25 + 40));
    const sign = dy >= 0 ? -1 : 1;
    const arcSourceY = sourceY + sign * arcHeight;
    const arcTargetY = targetY + sign * arcHeight;

    const cp1x = sourceX + dir * Math.max(40, absDx * 0.2);
    const cp1y = arcSourceY;
    const cp2x = targetX - dir * Math.max(40, absDx * 0.2);
    const cp2y = arcTargetY;

    const path = `M${sourceX},${sourceY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`;
    const labelX = (sourceX + 3 * cp1x + 3 * cp2x + targetX) / 8;
    const labelY = (sourceY + 3 * cp1y + 3 * cp2y + targetY) / 8;
    return [path, labelX, labelY];
  }

  if (isVerticalBacking) {
    const dir = sourcePosition === Position.Bottom ? 1 : -1;
    const absDy = Math.abs(dy);
    const arcWidth = Math.max(50, Math.min(120, absDy * 0.25 + 40));
    const sign = dx >= 0 ? 1 : -1;
    const arcSourceX = sourceX + sign * arcWidth;
    const arcTargetX = targetX + sign * arcWidth;

    const cp1x = arcSourceX;
    const cp1y = sourceY + dir * Math.max(40, absDy * 0.2);
    const cp2x = arcTargetX;
    const cp2y = targetY - dir * Math.max(40, absDy * 0.2);

    const path = `M${sourceX},${sourceY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`;
    const labelX = (sourceX + 3 * cp1x + 3 * cp2x + targetX) / 8;
    const labelY = (sourceY + 3 * cp1y + 3 * cp2y + targetY) / 8;
    return [path, labelX, labelY];
  }

  const [bezierPath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  return [bezierPath, labelX, labelY];
}
