export interface UITreeNode {
  name: string;
  type: "file" | "folder";
  path: string; // File path for files, folder path for folders (used as unique key)
  children?: UITreeNode[];
}

export interface FlatTreeNode {
  node: UITreeNode;
  depth: number;
}

/**
 * Builds a nested tree structure from a flat array of file paths.
 * Sorts folders first, files second, alphabetical within each.
 */
export function buildTreeFromPaths(paths: string[]): UITreeNode[] {
  const rootNodes: UITreeNode[] = [];

  for (const path of paths) {
    const parts = path.split("/");
    let currentLevel = rootNodes;
    let currentFolderPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (currentFolderPath) {
        currentFolderPath += "/" + part;
      } else {
        currentFolderPath = part;
      }

      const existingNode = currentLevel.find((n) => n.name === part);

      if (existingNode) {
        if (isFile) {
          existingNode.path = path;
        } else {
          currentLevel = existingNode.children!;
        }
      } else {
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
  }

  // Sort function: folders first, then alphabetical
  const sortNodes = (nodes: UITreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) {
        sortNodes(node.children);
      }
    }
  };

  sortNodes(rootNodes);
  return rootNodes;
}

/**
 * Flattens the nested tree into an array of visible nodes based on the expanded state.
 */
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
