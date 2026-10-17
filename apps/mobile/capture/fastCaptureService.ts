import type { MobileVaultStorageAdapter } from "../vault";
import { atomicWriteNote } from "../vault";
import { defaultVaultIndexer } from "../indexer";
import type { CapturedItem, CaptureDestination, CaptureResult } from "./types";
import {
  formatTimestamp,
  formatFileTimestamp,
  resolveAttachmentCollision,
  resolveNoteCollision,
} from "./captureUtils";
import { ensureDailyNote } from "./dailyNoteService";

/**
 * Executes fast capture for text, URLs, images, and audio into the vault.
 * Reuses desktop attachment conventions (ADR-0188) and indexes under withDbLock.
 */
export async function captureItem(
  adapter: MobileVaultStorageAdapter,
  item: CapturedItem,
  destination: CaptureDestination = "quick-notes",
): Promise<CaptureResult> {
  const now = new Date(item.timestamp ?? Date.now());
  const timestampStr = formatTimestamp(now);
  const fileTimeStr = formatFileTimestamp(now);

  let attachmentPath: string | undefined;
  let attachmentFilename: string | undefined;

  // 1. Process media attachment if present
  if (item.type === "image" || item.type === "audio") {
    const ext = item.type === "image" ? ".jpg" : ".m4a";
    const defaultName =
      item.type === "image"
        ? `capture-${fileTimeStr.replace(/\s+/g, "_")}${ext}`
        : `audio-${fileTimeStr.replace(/\s+/g, "_")}${ext}`;
    const rawName = item.filename || defaultName;

    // Disambiguate attachment filename in Attachments/
    attachmentPath = await resolveAttachmentCollision(
      adapter,
      "Attachments",
      rawName,
    );
    attachmentFilename = attachmentPath.split("/").pop() ?? rawName;

    // Copy or write file into vault Attachments/
    const parentFolder = attachmentPath.split("/").slice(0, -1).join("/");
    if (parentFolder) {
      await adapter.createFolder(parentFolder);
    }

    if (
      item.fileUri &&
      (item.fileUri.startsWith("file://") || item.fileUri.startsWith("/"))
    ) {
      try {
        await adapter.copyFile(item.fileUri, attachmentPath);
      } catch {
        await adapter.writeNote(attachmentPath, item.text ?? "");
      }
    } else {
      await adapter.writeNote(attachmentPath, item.text ?? "");
    }
  }

  // 2. Format capture body snippet
  let snippet = "";
  switch (item.type) {
    case "text":
      snippet = item.text ?? "";
      break;
    case "url":
      snippet = item.title
        ? `[${item.title}](${item.url})`
        : `[${item.url}](${item.url})`;
      if (item.text) snippet += `\n> ${item.text}`;
      break;
    case "image":
      snippet = `![[Attachments/${attachmentFilename}]]`;
      if (item.text) snippet += `\n${item.text}`;
      break;
    case "audio":
      snippet = `![[Attachments/${attachmentFilename}]]\n*Voice Memo (${timestampStr})*`;
      if (item.text) snippet += `\n${item.text}`;
      break;
  }

  let targetNotePath = "";
  let isNewNote = false;

  // 3. Route to destination (ADR-0188)
  if (destination === "quick-notes") {
    isNewNote = true;
    const baseName = item.title
      ? `Quick Notes/${item.title.replace(/[\\/:*?"<>|]/g, " ").trim()}.md`
      : `Quick Notes/Quick note ${fileTimeStr}.md`;
    targetNotePath = await resolveNoteCollision(adapter, baseName);
    const initialContent = `# ${targetNotePath.replace(/\.md$/i, "").split("/").pop()}\n\n${snippet}\n`;
    await atomicWriteNote(adapter, targetNotePath, initialContent);
  } else if (destination === "inbox") {
    targetNotePath = "Inbox.md";
    const entry = `- [${timestampStr}] ${snippet}`;
    let newContent = "";
    try {
      const existing = await adapter.readNote("Inbox.md");
      newContent = `${existing.content.trimEnd()}\n${entry}\n`;
    } catch {
      isNewNote = true;
      newContent = `# Inbox\n\n${entry}\n`;
    }
    await atomicWriteNote(adapter, "Inbox.md", newContent);
  } else if (destination === "daily") {
    const daily = await ensureDailyNote(adapter, now);
    targetNotePath = daily.path;
    isNewNote = daily.created;
    const entry = `- [${timestampStr}] ${snippet}`;
    let updatedContent = daily.content;
    if (updatedContent.includes("## Quick Capture")) {
      updatedContent = updatedContent.replace(
        "## Quick Capture",
        `## Quick Capture\n${entry}`,
      );
    } else {
      updatedContent = `${updatedContent.trimEnd()}\n\n## Quick Capture\n${entry}\n`;
    }
    await atomicWriteNote(adapter, targetNotePath, updatedContent);
  }

  // 4. Incremental SQLite re-index under withDbLock
  await defaultVaultIndexer.indexVault(adapter, false);

  return {
    targetNotePath,
    attachmentPath,
    isNewNote,
    contentAppended: snippet,
  };
}
