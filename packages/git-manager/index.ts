export { GitSidebarPanel } from "./src/components/GitSidebarPanel";
export { GitEmptyState } from "./src/components/GitEmptyState";
export { GitChangesList } from "./src/components/GitChangesList";
export { GitStatusRow } from "./src/components/GitStatusRow";
export { GitCommitBox } from "./src/components/GitCommitBox";
export { GitDiffViewer } from "./src/components/GitDiffViewer";
export { GitHistoryGraph } from "./src/components/GitHistoryGraph";
export { GitCommitDetailSheet } from "./src/components/GitCommitDetailSheet";
export { GitBranchSwitcher } from "./src/components/GitBranchSwitcher";
export { calculateGraphLanes } from "./src/graph/calculateGraphLanes";
export { useGitManagerStore } from "./src/store/useGitManagerStore";
export {
  fetchGitRepoInfo,
  initGitRepository,
  fetchGitStatus,
  stageGitPaths,
  unstageGitPaths,
  discardGitPaths,
  commitGit,
  fetchFileDiff,
  applyGitPatch,
  fetchGitLog,
  fetchGitCommitDetails,
  fetchGitBranches,
  switchGitBranch,
  createGitBranch,
  deleteGitBranch,
  stashGitChanges,
  popGitStash,
  listenToGitChanges,
} from "./src/api/gitClient";
export { parsePorcelainV2 } from "./src/parsers/parsePorcelainV2";
export type {
  GitRepoInfo,
  GitBranchInfo,
  GitFileChange,
  GitFileDiff,
  GitFileStatusCode,
  GitStatusSummary,
  GitCommitEntry,
  GitCommitFileChange,
  GitCommitDetail,
  GitGraphNode,
  GitGraphLaneConnection,
} from "./src/types/gitTypes";
