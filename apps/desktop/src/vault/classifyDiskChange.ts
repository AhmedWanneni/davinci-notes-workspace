export type DiskChangeClassification =
  | { type: "deleted" }
  | { type: "touched_only" }
  | { type: "pure_append"; tail: string }
  | { type: "conflict" };

/**
 * Classifies the difference between last known content and fresh disk content.
 * Identifies pure appends (losslessly mergeable) versus mid-file edits or deletions.
 */
export function classifyDiskChange(
  lastKnownContent: string,
  diskContent: string | null,
): DiskChangeClassification {
  if (diskContent === null) {
    return { type: "deleted" };
  }

  // 1. Exact match (mtime bumped without content changes, e.g. touch)
  if (diskContent === lastKnownContent) {
    return { type: "touched_only" };
  }

  // 2. Direct pure append
  if (diskContent.startsWith(lastKnownContent)) {
    const tail = diskContent.slice(lastKnownContent.length);
    if (tail.length > 0) {
      return { type: "pure_append", tail };
    }
  }

  // 3. CRLF-normalized comparison (handles mixed line-ending external tools)
  const normLast = lastKnownContent.replace(/\r\n/g, "\n");
  const normDisk = diskContent.replace(/\r\n/g, "\n");

  if (normDisk === normLast) {
    return { type: "touched_only" };
  }

  if (normDisk.startsWith(normLast)) {
    const normTail = normDisk.slice(normLast.length);
    if (normTail.length > 0) {
      // If original had CRLF, maintain CRLF in tail
      const tail = lastKnownContent.includes("\r\n")
        ? normTail.replace(/\n/g, "\r\n")
        : normTail;
      return { type: "pure_append", tail };
    }
  }

  // 4. Any other modification (mid-file edit, truncation, full overwrite)
  return { type: "conflict" };
}
