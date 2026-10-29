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

export interface GitFileDiff {
  path: string;
  originalContent: string;
  modifiedContent: string;
  patch: string;
  staged: boolean;
}

export interface GitCommitEntry {
  hash: string;
  parents: string[];
  authorName: string;
  authorDate: number;
  subject: string;
  refs: string;
}

export interface GitCommitFileChange {
  path: string;
  status: string;
  insertions: number;
  deletions: number;
}

export interface GitCommitDetail {
  hash: string;
  authorName: string;
  authorEmail: string;
  authorDate: number;
  message: string;
  files: GitCommitFileChange[];
}

export interface GitGraphLaneConnection {
  fromLane: number;
  toLane: number;
}

export interface GitGraphNode {
  commit: GitCommitEntry;
  lane: number;
  connections: GitGraphLaneConnection[];
}

export interface GitStatusSummary {
  repoInfo: GitRepoInfo;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  conflicts: GitFileChange[];
  untracked: GitFileChange[];
}
