import type { DriveClient, DriveFile } from "@app/sync-client";
import type { MobileVaultStorageAdapter } from "../vault";

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function executeWithRetry<T>(
  action: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelay = options.baseDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 4000;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;

      // Exponential backoff with jitter
      const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
      const jitter = Math.random() * 0.2 * delay;
      await new Promise((res) => setTimeout(res, delay + jitter));
    }
  }

  throw lastError;
}

export async function downloadFileAtomicallyWithRetry(
  drive: DriveClient,
  fileId: string,
  targetRelativePath: string,
  adapter: MobileVaultStorageAdapter,
  options: RetryOptions = {},
): Promise<ArrayBuffer> {
  return executeWithRetry(async () => {
    // 1. Download buffer from Drive
    const buffer = await drive.downloadFile(fileId);

    // 2. Atomic write: write to temp file first
    const nonce = Math.random().toString(36).substring(2, 9);
    const tempRelativePath = `.tmp.sync_${nonce}_${targetRelativePath.replace(/\//g, "_")}`;

    try {
      // Write to temp relative path
      await adapter.write(tempRelativePath, buffer);

      // Ensure target directory exists
      const targetParent = targetRelativePath.split("/").slice(0, -1).join("/");
      if (targetParent) {
        await adapter.createFolder(targetParent);
      }

      // Atomically move temp file to final path
      await adapter.renameNote(tempRelativePath, targetRelativePath);
      return buffer;
    } catch (err) {
      // Clean up temp file on failure so no partial/orphaned files remain
      try {
        await adapter.deleteNote(tempRelativePath);
      } catch {
        // ignore cleanup error
      }
      throw err;
    }
  }, options);
}

export async function uploadContentWithRetry(
  drive: DriveClient,
  name: string,
  hash: string,
  body: Blob,
  options: RetryOptions = {},
): Promise<{ file: DriveFile; uploaded: boolean }> {
  return executeWithRetry(async () => {
    // Content-addressing idempotency: check if already present on remote
    const existing = await drive.findByContentHash(hash);
    if (existing) {
      return { file: existing, uploaded: false };
    }

    return drive.uploadContent({ name, hash, body });
  }, options);
}
