import {
  resolveConflictAction,
  type ConflictAction,
  type DriveClient,
  type ManifestEntry,
} from "@app/sync-client";
import { atomicWriteNote, type MobileVaultStorageAdapter } from "../vault";
import type { MobileSyncIndexUpdater } from "./mobileSyncIndexUpdater";
import type { SyncConflictInfo } from "./types";
import { uploadContentWithRetry } from "./transferWithRetry";

export interface ApplyConflictContext {
  path: string;
  localEntry?: ManifestEntry;
  baseEntry?: ManifestEntry;
  remoteEntry?: ManifestEntry;
  remoteDeviceId: string;
  existingPaths: readonly string[];
  adapter: MobileVaultStorageAdapter;
  drive: DriveClient;
  indexUpdater: MobileSyncIndexUpdater;
  baseContent?: string;
}

export interface ConflictApplyResult {
  conflictInfo: SyncConflictInfo;
  extraPushEntries: ManifestEntry[];
}

export async function processAndApplyConflict(
  ctx: ApplyConflictContext,
): Promise<ConflictApplyResult> {
  // 1. Fetch local content if present
  let localContent: string | undefined;
  if (ctx.localEntry && !ctx.localEntry.deleted) {
    try {
      const file = await ctx.adapter.readNote(ctx.path);
      localContent = file.content;
    } catch {
      // not a text note or missing
    }
  }

  // 2. Fetch remote content if present
  let remoteContent: string | undefined;
  let remoteBuffer: ArrayBuffer | undefined;
  if (ctx.remoteEntry && !ctx.remoteEntry.deleted) {
    const remoteFile = await ctx.drive.findByContentHash(ctx.remoteEntry.hash);
    if (remoteFile) {
      remoteBuffer = await ctx.drive.downloadFile(remoteFile.id);
      try {
        remoteContent = new TextDecoder().decode(remoteBuffer);
      } catch {
        // binary
      }
    }
  }

  // 3. Fetch base content if present
  let baseContent: string | undefined = ctx.baseContent;
  if (!baseContent && ctx.baseEntry && !ctx.baseEntry.deleted) {
    const baseFile = await ctx.drive.findByContentHash(ctx.baseEntry.hash);
    if (baseFile) {
      try {
        const baseBuf = await ctx.drive.downloadFile(baseFile.id);
        baseContent = new TextDecoder().decode(baseBuf);
      } catch {
        // ignore
      }
    }
  }

  // 4. Resolve conflict action using shared @app/sync-client logic
  const action: ConflictAction = resolveConflictAction({
    path: ctx.path,
    localDeleted: ctx.localEntry?.deleted ?? true,
    remoteDeleted: ctx.remoteEntry?.deleted ?? true,
    localContent,
    baseContent: baseContent ?? "",
    remoteContent: remoteContent ?? remoteBuffer,
    remoteDeviceName: ctx.remoteDeviceId,
    existingPaths: ctx.existingPaths,
  });

  const extraPushEntries: ManifestEntry[] = [];

  // 4. Apply action to local filesystem and SQLite index
  switch (action.kind) {
    case "clean-merge": {
      if (action.mergedContent !== undefined) {
        await atomicWriteNote(ctx.adapter, ctx.path, action.mergedContent);
        await ctx.indexUpdater.upsert(ctx.path);
        const newHash = await ctx.adapter.hashFile(ctx.path);
        extraPushEntries.push({
          path: ctx.path,
          hash: newHash,
          size: action.mergedContent.length,
          deviceClock:
            Math.max(
              ctx.localEntry?.deviceClock ?? 0,
              ctx.remoteEntry?.deviceClock ?? 0,
            ) + 1,
          deleted: false,
        });
        // Upload merged content to remote so both sides converge
        await uploadContentWithRetry(
          ctx.drive,
          ctx.path,
          newHash,
          new Blob([action.mergedContent], { type: "text/markdown" }),
        );
      }
      break;
    }
    case "conflict-copy": {
      if (action.copyPath) {
        // 1. Preserve conflicting local version in copyPath
        if (localContent !== undefined) {
          await atomicWriteNote(ctx.adapter, action.copyPath, localContent);
        } else if (remoteContent !== undefined) {
          await atomicWriteNote(ctx.adapter, action.copyPath, remoteContent);
        } else if (remoteBuffer !== undefined) {
          await ctx.adapter.write(action.copyPath, remoteBuffer);
        }
        await ctx.indexUpdater.upsert(action.copyPath);
        const copyHash = await ctx.adapter.hashFile(action.copyPath);
        extraPushEntries.push({
          path: action.copyPath,
          hash: copyHash,
          size: localContent
            ? localContent.length
            : (remoteContent?.length ?? remoteBuffer?.byteLength ?? 0),
          deviceClock:
            Math.max(
              ctx.localEntry?.deviceClock ?? 0,
              ctx.remoteEntry?.deviceClock ?? 0,
            ) + 1,
          deleted: false,
        });

        // 2. Adopt remote version at original path ctx.path
        if (remoteContent !== undefined) {
          await atomicWriteNote(ctx.adapter, ctx.path, remoteContent);
        } else if (remoteBuffer !== undefined) {
          await ctx.adapter.write(ctx.path, remoteBuffer);
        }
        await ctx.indexUpdater.upsert(ctx.path);
        if (ctx.remoteEntry) {
          extraPushEntries.push({
            ...ctx.remoteEntry,
            deleted: false,
          });
        }
      }
      break;
    }
    case "delete-vs-edit-apply-remote": {
      if (remoteContent !== undefined) {
        await atomicWriteNote(ctx.adapter, ctx.path, remoteContent);
      } else if (remoteBuffer !== undefined) {
        await ctx.adapter.write(ctx.path, remoteBuffer);
      }
      await ctx.indexUpdater.upsert(ctx.path);
      if (ctx.remoteEntry) {
        extraPushEntries.push({
          ...ctx.remoteEntry,
          deleted: false,
        });
      }
      break;
    }
    case "delete-vs-edit-keep-local": {
      // Local edit kept untouched; ensure it gets pushed
      if (ctx.localEntry) {
        extraPushEntries.push(ctx.localEntry);
      }
      break;
    }
  }

  return {
    conflictInfo: {
      path: ctx.path,
      localHash: ctx.localEntry?.hash,
      remoteHash: ctx.remoteEntry?.hash,
      message: action.surfacedMessage,
      resolution: action.kind,
    },
    extraPushEntries,
  };
}
