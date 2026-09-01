import { merge as diff3Merge } from "node-diff3";

export type TextConflictKind = "text-merge-clean" | "text-merge-conflict";

export interface TextConflictInput {
  path: string;
  localContent: string;
  baseContent: string;
  remoteContent: string;
  localLabel?: string;
  remoteLabel?: string;
}

export interface TextConflictResult {
  path: string;
  mergedContent: string;
  hasConflict: boolean;
  kind: TextConflictKind;
}

export interface BinaryConflictInput {
  path: string;
  remoteDeviceName: string;
  existingPaths: readonly string[];
}

export interface BinaryConflictResult {
  originalPath: string;
  copyPath: string;
  kind: "binary-copy";
}

export interface DeleteVsEditInput {
  path: string;
  localDeleted: boolean;
  remoteDeleted: boolean;
}

export interface DeleteVsEditResult {
  path: string;
  winner: "local" | "remote";
  kind: "delete-vs-edit-local-wins" | "delete-vs-edit-remote-wins";
  surfacedMessage: string;
}

/** Only .md text files undergo line-based diff3 merge. */
export function isTextMergeable(path: string): boolean {
  return path.toLowerCase().endsWith(".md");
}

/** Perform line-based three-way diff3 merge for text files (.md). */
export function resolveTextConflict(
  input: TextConflictInput,
): TextConflictResult {
  const localLines = input.localContent.split(/\r?\n/);
  const baseLines = input.baseContent.split(/\r?\n/);
  const remoteLines = input.remoteContent.split(/\r?\n/);

  const diffResult = diff3Merge(localLines, baseLines, remoteLines, {
    excludeFalseConflicts: true,
    label: {
      a: input.localLabel ?? "local",
      b: input.remoteLabel ?? "remote",
    },
  });

  const mergedContent = diffResult.result.join("\n");
  const hasConflict = diffResult.conflict;

  return {
    path: input.path,
    mergedContent,
    hasConflict,
    kind: hasConflict ? "text-merge-conflict" : "text-merge-clean",
  };
}

/** Generate a non-colliding copy filename for binary/atomic conflicts. */
export function resolveBinaryConflictName(
  input: BinaryConflictInput,
): BinaryConflictResult {
  const existingSet = new Set(input.existingPaths.map((p) => p.toLowerCase()));
  const lastDot = input.path.lastIndexOf(".");
  const stem = lastDot !== -1 ? input.path.slice(0, lastDot) : input.path;
  const ext = lastDot !== -1 ? input.path.slice(lastDot) : "";
  const device = input.remoteDeviceName.trim() || "remote";

  let candidate = `${stem} (${device} copy)${ext}`;
  let counter = 1;

  while (existingSet.has(candidate.toLowerCase())) {
    candidate = `${stem} (${device} copy) ${counter}${ext}`;
    counter++;
  }

  return {
    originalPath: input.path,
    copyPath: candidate,
    kind: "binary-copy",
  };
}

/** Resolve conflict where one side edited and the other deleted — edit always wins. */
export function resolveDeleteVsEdit(
  input: DeleteVsEditInput,
): DeleteVsEditResult {
  if (input.localDeleted && !input.remoteDeleted) {
    return {
      path: input.path,
      winner: "remote",
      kind: "delete-vs-edit-remote-wins",
      surfacedMessage: `File '${input.path}' was edited remotely; local deletion ignored and remote edit preserved.`,
    };
  }

  return {
    path: input.path,
    winner: "local",
    kind: "delete-vs-edit-local-wins",
    surfacedMessage: `File '${input.path}' was edited locally; remote deletion ignored and local edit preserved.`,
  };
}
