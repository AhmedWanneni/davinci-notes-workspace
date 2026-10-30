import type { DriveClient } from "./driveApi";
import type { ContentUpload, DriveFile } from "./driveApiTypes";

export async function uploadContentHelper(
  drive: DriveClient,
  item: ContentUpload,
): Promise<{ file: DriveFile; uploaded: boolean }> {
  const existing = await drive.findByContentHash(item.hash);
  if (existing) return { file: existing, uploaded: false };
  return {
    file: await drive.uploadAppData(`content/${item.hash}`, item.body, {
      contentHash: item.hash,
    }),
    uploaded: true,
  };
}

export async function uploadContentBatchHelper(
  drive: DriveClient,
  items: readonly ContentUpload[],
  batchSize = 8,
): Promise<DriveFile[]> {
  const uploaded: DriveFile[] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map((item) => uploadContentHelper(drive, item)),
    );
    uploaded.push(...results.map((result) => result.file));
  }
  return uploaded;
}
