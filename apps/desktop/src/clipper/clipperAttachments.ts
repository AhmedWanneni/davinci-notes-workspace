import { invoke } from "@tauri-apps/api/core";
import type { AttachmentSettings } from "@app/attachments";
import { resolveAttachmentFolder } from "@app/attachments";
import type { ClipPayload } from "@app/clipper-core";
import { rewriteMarkdownImageLinks } from "@app/clipper-core";
import { computeVaultRelativeLink, writeAttachmentToVault } from "../vault";

export const MAX_CLIP_ATTACHMENTS = 50;
export const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20 MiB

export interface ProcessClipAttachmentsOptions {
  vaultPath: string;
  activeNotePath: string;
  attachmentSettings: AttachmentSettings;
}

/**
 * Processes remote image attachments for a clip (Phase 6, ADR-0176).
 *
 * Downloads attachments via the native SSRF-validated command, writes them into
 * the vault using the standard attachments pipeline (handling name collisions and
 * folder routing), and rewrites remote image URLs in the note body to local vault
 * relative links.
 *
 * Caps:
 * - Max 50 attachments per clip
 * - Max 20 MiB total per clip (1 MiB per image enforced natively)
 * - Individual download failures are non-fatal: failed images remain remote.
 */
export async function processClipAttachments(
  payload: ClipPayload,
  options: ProcessClipAttachmentsOptions,
): Promise<ClipPayload> {
  const attachments = payload.attachments;
  if (!attachments || attachments.length === 0) {
    return payload;
  }

  const targetFolder = resolveAttachmentFolder(
    options.activeNotePath,
    options.attachmentSettings,
  );

  const replacements = new Map<string, string>();
  let totalBytes = 0;
  let count = 0;

  for (const attachment of attachments) {
    if (count >= MAX_CLIP_ATTACHMENTS) {
      break;
    }
    if (totalBytes >= MAX_TOTAL_ATTACHMENT_BYTES) {
      break;
    }

    try {
      const rawBytes = await invoke<number[] | Uint8Array>(
        "clipper_fetch_attachment",
        { url: attachment.sourceUrl },
      );
      const bytes = new Uint8Array(rawBytes);
      if (bytes.byteLength === 0) {
        continue;
      }
      if (totalBytes + bytes.byteLength > MAX_TOTAL_ATTACHMENT_BYTES) {
        break;
      }

      totalBytes += bytes.byteLength;
      count += 1;

      const writtenPath = await writeAttachmentToVault(
        options.vaultPath,
        targetFolder,
        attachment.suggestedName,
        bytes,
      );

      const relativeLink = computeVaultRelativeLink(
        options.vaultPath,
        writtenPath,
      );
      replacements.set(attachment.sourceUrl, relativeLink);
    } catch (error) {
      console.warn(
        `[clipper] failed to download attachment ${attachment.sourceUrl}:`,
        error,
      );
    }
  }

  if (replacements.size === 0) {
    return payload;
  }

  const rewrittenBody = rewriteMarkdownImageLinks(payload.body, replacements);

  return {
    ...payload,
    body: rewrittenBody,
  };
}
