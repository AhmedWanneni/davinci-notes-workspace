export interface GitRepoInfo {
  gitAvailable: boolean;
  isRepo: boolean;
  branch: string | null;
  isEmpty: boolean;
  isDetached: boolean;
}

export type GitFileStatusCode =
  | "M" // Modified
  | "A" // Added
  | "D" // Deleted
  | "R" // Renamed
  | "C" // Copied
  | "U" // Unmerged / Conflict
  | "?"; // Untracked

export interface GitFileChange {
  path: string;
  oldPath?: string;
  statusCode: GitFileStatusCode;
  staged: boolean;
}

export interface GitStatusSummary {
  repoInfo: GitRepoInfo;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  conflicts: GitFileChange[];
  untracked: GitFileChange[];
}
