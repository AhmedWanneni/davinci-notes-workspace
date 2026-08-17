/**
 * Cycle prevention and depth-capping utilities for nested canvas cards.
 */

export const MAX_CANVAS_NESTING_DEPTH = 3;

export function normalizeCanvasPath(filePath: string): string {
  if (!filePath || typeof filePath !== "string") return "";
  return filePath.trim().replace(/^[\\/]+|[\\/]+$/g, "").toLowerCase();
}

export interface CanvasCycleResult {
  isCycle: boolean;
  cycleChain?: string[];
}

export function detectCanvasCycle(
  targetPath: string,
  ancestorChain: readonly string[] = [],
): CanvasCycleResult {
  const normalizedTarget = normalizeCanvasPath(targetPath);
  if (!normalizedTarget) return { isCycle: false };

  const normalizedAncestors = ancestorChain.map(normalizeCanvasPath);
  const matchIndex = normalizedAncestors.indexOf(normalizedTarget);

  if (matchIndex !== -1) {
    const cyclePortion = [
      ...ancestorChain.slice(matchIndex),
      targetPath,
    ];
    return { isCycle: true, cycleChain: cyclePortion };
  }

  return { isCycle: false };
}

export function checkNestingLimit(
  ancestorChain: readonly string[] = [],
  maxDepth = MAX_CANVAS_NESTING_DEPTH,
): boolean {
  return ancestorChain.length >= maxDepth;
}

export type NestedCanvasValidationResult =
  | { valid: true }
  | {
      valid: false;
      reason: "cycle";
      cycleChain: string[];
    }
  | {
      valid: false;
      reason: "depth_limit";
      currentDepth: number;
      maxDepth: number;
    };

export function validateNestedCanvas(
  targetPath: string,
  ancestorChain: readonly string[] = [],
  maxDepth = MAX_CANVAS_NESTING_DEPTH,
): NestedCanvasValidationResult {
  const cycleResult = detectCanvasCycle(targetPath, ancestorChain);
  if (cycleResult.isCycle) {
    return {
      valid: false,
      reason: "cycle",
      cycleChain: cycleResult.cycleChain ?? [targetPath, targetPath],
    };
  }

  if (checkNestingLimit(ancestorChain, maxDepth)) {
    return {
      valid: false,
      reason: "depth_limit",
      currentDepth: ancestorChain.length,
      maxDepth,
    };
  }

  return { valid: true };
}
