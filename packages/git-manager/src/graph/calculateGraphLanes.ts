import type {
  GitCommitEntry,
  GitGraphLaneConnection,
  GitGraphNode,
} from "../types/gitTypes";

/**
 * Deterministically assigns visual lanes (0, 1, 2...) and parent connections
 * to commits ordered from newest to oldest.
 */
export function calculateGraphLanes(commits: GitCommitEntry[]): GitGraphNode[] {
  const activeLanes: (string | null)[] = [];
  const nodes: GitGraphNode[] = [];

  for (const commit of commits) {
    // 1. Locate if an existing lane was waiting for this commit hash
    let lane = activeLanes.indexOf(commit.hash);
    if (lane === -1) {
      // Find first empty slot or append
      const emptyIdx = activeLanes.indexOf(null);
      if (emptyIdx !== -1) {
        lane = emptyIdx;
      } else {
        lane = activeLanes.length;
        activeLanes.push(null);
      }
    }

    // Free the current commit from active lanes
    activeLanes[lane] = null;

    // 2. Assign parents to lanes and record connections
    const connections: GitGraphLaneConnection[] = [];
    commit.parents.forEach((parentHash, pIdx) => {
      let targetLane = activeLanes.indexOf(parentHash);
      if (targetLane === -1) {
        // Prefer reusing the current lane for the first parent
        if (pIdx === 0 && activeLanes[lane] === null) {
          targetLane = lane;
          activeLanes[lane] = parentHash;
        } else {
          // Find first available slot
          const emptySlot = activeLanes.indexOf(null);
          if (emptySlot !== -1) {
            targetLane = emptySlot;
            activeLanes[emptySlot] = parentHash;
          } else {
            targetLane = activeLanes.length;
            activeLanes.push(parentHash);
          }
        }
      }

      connections.push({ fromLane: lane, toLane: targetLane });
    });

    nodes.push({ commit, lane, connections });
  }

  return nodes;
}
