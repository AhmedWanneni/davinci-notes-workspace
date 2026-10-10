export interface UITreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: UITreeNode[];
}

export interface FlatTreeNode {
  node: UITreeNode;
  depth: number;
}

export type TreeSortOrder = "name-asc" | "name-desc";

function sortNodes(
  nodes: UITreeNode[],
  sortOrder: TreeSortOrder = "name-asc",
): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    const cmp = a.name.localeCompare(b.name);
    return sortOrder === "name-asc" ? cmp : -cmp;
  });
  for (const node of nodes) {
    if (node.children) {
      sortNodes(node.children, sortOrder);
    }
  }
}

function ensureFolderChain(rootNodes: UITreeNode[], folderPath: string): void {
  const parts = folderPath.split("/");
  let currentLevel = rootNodes;
  let currentFolderPath = "";

  for (const part of parts) {
    currentFolderPath = currentFolderPath
      ? `${currentFolderPath}/${part}`
      : part;
    const existing = currentLevel.find((node) => node.name === part);
    if (existing) {
      if (existing.type === "folder") {
        if (!existing.children) {
          existing.children = [];
        }
        currentLevel = existing.children;
      }
      continue;
    }

    const folderNode: UITreeNode = {
      name: part,
      type: "folder",
      path: currentFolderPath,
      children: [],
    };
    currentLevel.push(folderNode);
    currentLevel = folderNode.children!;
  }
}

/**
 * Builds a nested tree from vault file paths and explicit folder paths
 * (empty folders only appear via `folderPaths`).
 */
export function buildTreeFromPaths(
  filePaths: string[],
  folderPaths: string[] = [],
  sortOrder: TreeSortOrder = "name-asc",
): UITreeNode[] {
  const rootNodes: UITreeNode[] = [];

  for (const folderPath of folderPaths) {
    ensureFolderChain(rootNodes, folderPath);
  }

  for (const path of filePaths) {
    const parts = path.split("/");
    let currentLevel = rootNodes;
    let currentFolderPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentFolderPath = currentFolderPath
        ? `${currentFolderPath}/${part}`
        : part;

      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        if (isFile) {
          existingNode.type = "file";
          existingNode.path = path;
          delete existingNode.children;
        } else if (existingNode.children) {
          currentLevel = existingNode.children;
        }
        continue;
      }

      const newNode: UITreeNode = {
        name: part,
        type: isFile ? "file" : "folder",
        path: isFile ? path : currentFolderPath,
      };
      if (!isFile) {
        newNode.children = [];
      }
      currentLevel.push(newNode);
      if (!isFile) {
        currentLevel = newNode.children!;
      }
    }
  }

  sortNodes(rootNodes, sortOrder);
  return rootNodes;
}

/** Flattens the nested tree into visible nodes based on expand/collapse state. */
export function flattenVisibleTree(
  tree: UITreeNode[],
  expandedFolders: Set<string>,
  depth: number = 0,
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];

  for (const node of tree) {
    result.push({ node, depth });
    if (
      node.type === "folder" &&
      expandedFolders.has(node.path) &&
      node.children
    ) {
      result.push(
        ...flattenVisibleTree(node.children, expandedFolders, depth + 1),
      );
    }
  }

  return result;
}

/** Extracts all unique folder paths recursively from tree. */
export function getAllFolderPaths(tree: UITreeNode[]): string[] {
  const paths: string[] = [];
  function collect(nodes: UITreeNode[]) {
    for (const node of nodes) {
      if (node.type === "folder") {
        paths.push(node.path);
        if (node.children) collect(node.children);
      }
    }
  }
  collect(tree);
  return paths;
}
