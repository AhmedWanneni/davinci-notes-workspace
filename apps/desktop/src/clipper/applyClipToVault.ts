import { invoke } from "@tauri-apps/api/core";
import type { ClipAck, ClipBehavior, ClipPayload } from "@app/clipper-core";
import { composeNoteFile } from "@app/clipper-core";
import { BOOKMARKS_JSON_PATH, useBookmarkStore } from "../bookmarks";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { processClipAttachments } from "./clipperAttachments";
import {
  appendToNoteInVault,
  createNoteInVault,
  resolveUniqueNotePath,
  type ClipInsertPosition,
} from "../vault";

/** The `clipper:clip-received` event (mirrors Rust `clipper_payload::ClipReceivedEvent`). */
export interface ClipReceivedEvent {
  clipId: string;
  payload: ClipPayload;
  /** Vault-relative path Rust resolved and validated, e.g. `Clippings/Note.md`. */
  relativePath: string;
}

export type ClipWritePlan =
  | { kind: "create"; path: string }
  | { kind: "insert"; path: string; position: ClipInsertPosition };

/**
 * What each wire behaviour means for the vault, total by construction so a new
 * `ClipBehavior` cannot be added without deciding this.
 *
 * `append-top` is an alias of `prepend`: the wire carries both, and both mean
 * "insert above the existing body". The `daily-*` behaviours differ only in the
 * note name their template renders, so they map like plain append/prepend.
 */
const BEHAVIOR_ACTIONS: Record<ClipBehavior, "create" | ClipInsertPosition> = {
  create: "create",
  "append-bottom": "bottom",
  "daily-append": "bottom",
  "append-top": "top",
  prepend: "top",
  "daily-prepend": "top",
};

/**
 * Which canonical write a validated clip needs.
 *
 * The desktop resolves the behaviour (ADR-0176); the extension already resolved
 * the path. `create` never overwrites — a taken name gets ADR-0110's numeric
 * suffix (`Note.md`, `Note 1.md`, `Note 2.md`). An append or prepend targets the
 * rendered name as-is: that note existing is the point.
 */
export function clipTargetPlan(
  behavior: ClipBehavior,
  relativePath: string,
  existingPaths: readonly string[],
): ClipWritePlan {
  // Rust refuses an unknown behaviour (`invalid-payload`), so the fallback is
  // unreachable; it exists so a contract drift can never silently overwrite.
  const action = BEHAVIOR_ACTIONS[behavior] ?? "create";
  if (action === "create") {
    return {
      kind: "create",
      path: resolveUniqueNotePath(existingPaths, relativePath),
    };
  }
  return { kind: "insert", path: relativePath, position: action };
}

function rejected(
  clipId: string,
  error: ClipAck["error"],
  path?: string,
): ClipAck {
  return { clipId, status: "rejected", error, path };
}

/**
 * Perform a validated clip through the canonical vault path (ADR-0177) and
 * report what actually happened, so the extension's ack is truthful.
 *
 * **Never throws.** An unexpected failure becomes `app-busy` — the only
 * retryable code on the wire, because the extension keeps a non-`written` clip
 * queued (ADR-0178) and retries it, so a report of `app-busy` can never lose a
 * clip. The detail goes to the console for the desktop's own diagnostics.
 */
export async function applyClipToVault(
  event: ClipReceivedEvent,
): Promise<ClipAck> {
  const clipId = event.clipId;
  const store = useWorkspaceStore.getState();
  if (!store.vaultPath) {
    // Nothing to write into: the listener can be enabled with no vault open.
    return rejected(clipId, "vault-not-open");
  }

  // Multi-vault rule (open decision O4, plan check 5):
  const targetVaultId = event.payload.target.vaultId;
  if (targetVaultId) {
    const currentVaultName = store.vaultPath
      .replaceAll("\\", "/")
      .split("/")
      .filter(Boolean)
      .pop();
    if (
      targetVaultId !== store.vaultPath &&
      targetVaultId !== currentVaultName
    ) {
      return rejected(clipId, "vault-not-open");
    }
  }

  try {
    // Dedupe ledger check (ADR-0178, plan check 2):
    const duplicatePath = await invoke<string | null>(
      "clipper_check_duplicate",
      {
        clipId: event.clipId,
        contentHash: event.payload.contentHash,
        relativePath: event.relativePath,
      },
    );
    if (duplicatePath) {
      return rejected(clipId, "duplicate", duplicatePath);
    }

    let payload = event.payload;
    if (payload.mode === "bookmark") {
      const cleanNoteTitle = payload.target.noteName.replace(/\.md$/i, "").trim();
      const rawFolder = payload.target.folder.trim();
      const folder =
        rawFolder && rawFolder.toLowerCase() !== "clippings"
          ? rawFolder
          : undefined;
      useBookmarkStore.getState().addWebBookmark({
        url: payload.source.url,
        title: cleanNoteTitle || payload.source.title,
        domain: payload.source.domain,
        description: payload.source.description,
        folder,
        tags: payload.tags,
        favicon: payload.source.favicon,
      });

      try {
        await invoke("clipper_record_written", {
          clipId: payload.clipId,
          contentHash: payload.contentHash,
          relativePath: BOOKMARKS_JSON_PATH,
        });
      } catch (recordError) {
        console.warn("[clipper] failed to record bookmark in dedupe ledger:", recordError);
      }

      return { clipId, status: "written", path: BOOKMARKS_JSON_PATH };
    }

    if (payload.attachments && payload.attachments.length > 0) {
      payload = await processClipAttachments(payload, {
        vaultPath: store.vaultPath,
        activeNotePath: event.relativePath,
        attachmentSettings: store.attachmentSettings,
      });
    }

    const plan = clipTargetPlan(
      payload.behavior,
      event.relativePath,
      store.allNotePaths,
    );
    const path =
      plan.kind === "create"
        ? await createNoteInVault(plan.path, composeNoteFile(payload))
        : await appendToNoteInVault(plan.path, payload.body, plan.position);

    try {
      await invoke("clipper_record_written", {
        clipId: payload.clipId,
        contentHash: payload.contentHash,
        relativePath: path,
      });
    } catch (recordError) {
      console.warn("[clipper] failed to record in dedupe ledger:", recordError);
    }

    return { clipId, status: "written", path };
  } catch (error) {
    console.error(`[clipper] could not write clip ${clipId}:`, error);
    return rejected(clipId, "app-busy");
  }
}
