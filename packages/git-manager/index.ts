export { GitSidebarPanel } from "./src/components/GitSidebarPanel";
export { GitEmptyState } from "./src/components/GitEmptyState";
export { GitChangesList } from "./src/components/GitChangesList";
export { GitStatusRow } from "./src/components/GitStatusRow";
export { GitCommitBox } from "./src/components/GitCommitBox";
export { GitDiffViewer } from "./src/components/GitDiffViewer";
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
  listenToGitChanges,
} from "./src/api/gitClient";
export { parsePorcelainV2 } from "./src/parsers/parsePorcelainV2";
export type {
  GitRepoInfo,
  GitFileChange,
  GitFileDiff,
  GitFileStatusCode,
  GitStatusSummary,
} from "./src/types/gitTypes";
