export type DropEffect = "none" | "copy" | "link" | "move";

export interface DraggedNodeInfo {
  path: string;
  isFolder?: boolean;
}

export interface DropTargetInfo {
  path: string;
  isFolder?: boolean;
}

export function getParentFolder(path: string): string {
  if (!path) return "";
  const lastSlash = path.lastIndexOf("/");
  return lastSlash === -1 ? "" : path.slice(0, lastSlash);
}

export function isHiddenOrSystemPath(path: string): boolean {
  if (!path) return false;
  return path.split("/").some((segment) => segment.startsWith("."));
}

let activeDraggedNode: DraggedNodeInfo | null = null;

export function setActiveDraggedNode(node: DraggedNodeInfo | null): void {
  activeDraggedNode = node;
}

export function getActiveDraggedNode(): DraggedNodeInfo | null {
  return activeDraggedNode;
}

/**
 * Validates drop targets for internal tree moves and computes dropEffect.
 * Disallows:
 * - self (folder onto itself)
 * - descendant (folder onto its subfolder)
 * - current parent (dropping an item where it already lives)
 * - hidden/system entries (.git, .obsidian, etc.)
 * Resolves file-row target to its parent folder.
 */
export function getDropEffect(
  dragged: string | DraggedNodeInfo | null | undefined,
  target: string | DropTargetInfo,
): "move" | "none" {
  if (!dragged) {
    return "none";
  }

  const draggedPath = typeof dragged === "string" ? dragged : dragged.path;
  if (!draggedPath) {
    return "none";
  }

  const isDraggedFolder =
    typeof dragged === "string"
      ? !/\.[a-zA-Z0-9]+$/.test(dragged)
      : Boolean(dragged.isFolder);

  const targetPath = typeof target === "string" ? target : target.path;
  const isTargetFolder =
    typeof target === "string"
      ? target === "" || !/\.[a-zA-Z0-9]+$/.test(target)
      : (target.isFolder ?? true);

  // If dropping on a file-row, resolve target to the file's parent folder
  const resolvedTargetFolder = isTargetFolder
    ? targetPath
    : getParentFolder(targetPath);

  // 1. Hidden / system entries
  if (
    isHiddenOrSystemPath(resolvedTargetFolder) ||
    isHiddenOrSystemPath(targetPath) ||
    isHiddenOrSystemPath(draggedPath)
  ) {
    return "none";
  }

  // 2. Self (folder onto itself)
  if (draggedPath === resolvedTargetFolder) {
    return "none";
  }

  // 3. Descendant (folder into its child/subfolder)
  if (isDraggedFolder && resolvedTargetFolder.startsWith(`${draggedPath}/`)) {
    return "none";
  }

  // 4. Current parent
  const currentParent = getParentFolder(draggedPath);
  if (resolvedTargetFolder === currentParent) {
    return "none";
  }

  return "move";
}
