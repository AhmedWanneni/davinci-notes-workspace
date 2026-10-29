import type { GitFileChange, GitFileStatusCode } from "../types/gitTypes";

export interface ParsedPorcelainResult {
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  conflicts: GitFileChange[];
  untracked: GitFileChange[];
}

export function parsePorcelainV2(raw: string): ParsedPorcelainResult {
  const staged: GitFileChange[] = [];
  const unstaged: GitFileChange[] = [];
  const conflicts: GitFileChange[] = [];
  const untracked: GitFileChange[] = [];

  if (!raw || raw.trim().length === 0) {
    return { staged, unstaged, conflicts, untracked };
  }

  // In -z mode, entries are separated by NUL characters (\0).
  const tokens = raw.split("\0");

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token || token.length === 0) {
      i++;
      continue;
    }

    // Type 1: Ordinary changed entry
    // Format: 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
    if (token.startsWith("1 ")) {
      const parts = token.split(" ");
      if (parts.length >= 9) {
        const xy = parts[1];
        // Path starts from index 8 onwards (in case path has spaces, though in -z mode path is intact)
        const path = parts.slice(8).join(" ");
        const stagedCode = xy[0] as GitFileStatusCode;
        const unstagedCode = xy[1] as GitFileStatusCode;

        if (stagedCode !== ".") {
          staged.push({
            path,
            statusCode: stagedCode,
            staged: true,
          });
        }
        if (unstagedCode !== ".") {
          unstaged.push({
            path,
            statusCode: unstagedCode,
            staged: false,
          });
        }
      }
      i++;
      continue;
    }

    // Type 2: Renamed or copied entry
    // Format: 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X><score> <path>\0<origPath>
    if (token.startsWith("2 ")) {
      const parts = token.split(" ");
      if (parts.length >= 10) {
        const xy = parts[1];
        const path = parts.slice(9).join(" ");
        const origPath = tokens[i + 1] || "";
        const stagedCode = xy[0] as GitFileStatusCode;
        const unstagedCode = xy[1] as GitFileStatusCode;

        if (stagedCode !== ".") {
          staged.push({
            path,
            oldPath: origPath,
            statusCode: stagedCode,
            staged: true,
          });
        }
        if (unstagedCode !== ".") {
          unstaged.push({
            path,
            oldPath: origPath,
            statusCode: unstagedCode,
            staged: false,
          });
        }
        i += 2; // skip origPath token
        continue;
      }
      i++;
      continue;
    }

    // Type u: Unmerged entry (Conflict)
    // Format: u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
    if (token.startsWith("u ")) {
      const parts = token.split(" ");
      if (parts.length >= 11) {
        const path = parts.slice(10).join(" ");
        conflicts.push({
          path,
          statusCode: "U",
          staged: false,
        });
      }
      i++;
      continue;
    }

    // Type ?: Untracked item
    // Format: ? <path>
    if (token.startsWith("? ")) {
      const path = token.slice(2);
      untracked.push({
        path,
        statusCode: "?",
        staged: false,
      });
      unstaged.push({
        path,
        statusCode: "?",
        staged: false,
      });
      i++;
      continue;
    }

    // Header or Ignored lines (# branch..., ! ignored)
    i++;
  }

  return { staged, unstaged, conflicts, untracked };
}
