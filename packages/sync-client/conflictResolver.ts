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

export type ConflictActionKind =
  | "clean-merge"
  | "conflict-copy"
  | "delete-vs-edit-keep-local"
  | "delete-vs-edit-apply-remote";

export interface ConflictAction {
  kind: ConflictActionKind;
  path: string;
  mergedContent?: string;
  copyPath?: string;
  copyContent?: string | ArrayBuffer;
  surfacedMessage: string;
}

export interface ConflictActionInput {
  path: string;
  localDeleted: boolean;
  remoteDeleted: boolean;
  localContent?: string | ArrayBuffer;
  baseContent?: string | ArrayBuffer;
  remoteContent?: string | ArrayBuffer;
  remoteDeviceName: string;
  existingPaths: readonly string[];
}

/** Unified conflict resolution orchestrator satisfying zero-silent-data-loss policy. */
export function resolveConflictAction(
  input: ConflictActionInput,
): ConflictAction {
  // 1. Delete vs Edit
  if (input.localDeleted !== input.remoteDeleted) {
    const res = resolveDeleteVsEdit({
      path: input.path,
      localDeleted: input.localDeleted,
      remoteDeleted: input.remoteDeleted,
    });
    return {
      kind:
        res.winner === "local"
          ? "delete-vs-edit-keep-local"
          : "delete-vs-edit-apply-remote",
      path: input.path,
      surfacedMessage: res.surfacedMessage,
      copyContent: res.winner === "remote" ? input.remoteContent : undefined,
    };
  }

  // 2. Both edited / created: check text mergeability
  if (isTextMergeable(input.path)) {
    const toStr = (v?: string | ArrayBuffer): string =>
      typeof v === "string" ? v : v ? new TextDecoder().decode(v) : "";
    const local = toStr(input.localContent);
    const base = toStr(input.baseContent);
    const remote = toStr(input.remoteContent);

    const mergeResult = resolveTextConflict({
      path: input.path,
      localContent: local,
      baseContent: base,
      remoteContent: remote,
      remoteLabel: input.remoteDeviceName,
    });

    if (!mergeResult.hasConflict) {
      return {
        kind: "clean-merge",
        path: input.path,
        mergedContent: mergeResult.mergedContent,
        surfacedMessage: `Cleanly merged edits on '${input.path}'.`,
      };
    }
  }

  // 3. Merge cannot be proven safe: keep both versions (conflict copy)
  const copyRes = resolveBinaryConflictName({
    path: input.path,
    remoteDeviceName: input.remoteDeviceName,
    existingPaths: input.existingPaths,
  });

  return {
    kind: "conflict-copy",
    path: input.path,
    copyPath: copyRes.copyPath,
    copyContent: input.remoteContent,
    surfacedMessage: `Conflicting changes on '${input.path}' could not be safely merged. Preserved both versions as '${copyRes.copyPath}'.`,
  };
}
