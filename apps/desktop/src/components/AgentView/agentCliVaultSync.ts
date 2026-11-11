import type { AgentToolCall, AgentToolResult } from "@app/ai-api";
import type { VaultMutationBackend } from "@app/ai-agent";
import { extractConversationalToolCalls } from "@app/ai-runtime";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { listFolders, listNotes } from "../../vault/vaultCommands";
import { isIgnoredAgentArtifact } from "./agentArtifactFilter";

export interface VaultSyncResult {
  cleanedOutput: string;
  toolCalls: AgentToolCall[];
  toolResults: AgentToolResult[];
}

function getAttr(tagAttrs: string, name: string): string {
  const re = new RegExp(`${name}=["']([^"']+)["']`, "i");
  return re.exec(tagAttrs)?.[1]?.trim() || "";
}

/**
 * Extracts explicit <vault_action ...> tags from assistant/CLI output.
 */
export function parseVaultActionTags(text: string): {
  calls: AgentToolCall[];
  cleanedText: string;
} {
  const calls: AgentToolCall[] = [];
  if (!text) return { calls, cleanedText: "" };

  const blockRe =
    /<vault_action\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/vault_action>)/gi;
  let idx = 0;
  const cleanedText = text
    .replace(blockRe, (_full, attrs: string, body?: string) => {
      const type = getAttr(attrs, "type").toLowerCase();
      const path = getAttr(attrs, "path").replace(/^\/+|\/+$/g, "");
      const fromPath = getAttr(attrs, "from").replace(/^\/+|\/+$/g, "");
      const toPath = getAttr(attrs, "to").replace(/^\/+|\/+$/g, "");
      const content = (body ?? "").trim();

      if (type === "create_folder" && path) {
        calls.push({
          id: `va_folder_${Date.now()}_${idx++}`,
          name: "create_folder",
          arguments: { path },
        });
      } else if (
        (type === "create_note" ||
          type === "edit_note" ||
          type === "append_to_note") &&
        path
      ) {
        calls.push({
          id: `va_note_${Date.now()}_${idx++}`,
          name: type,
          arguments: { path, content },
        });
      } else if (type === "move_note" && fromPath && toPath) {
        calls.push({
          id: `va_move_${Date.now()}_${idx++}`,
          name: "move_note",
          arguments: { fromPath, toPath },
        });
      }
      return "";
    })
    .trim();

  return { calls, cleanedText };
}

export function ensureParentFolderToolCalls(
  toolCalls: AgentToolCall[],
  toolResults: AgentToolResult[],
): { toolCalls: AgentToolCall[]; toolResults: AgentToolResult[] } {
  const nextCalls = [...toolCalls];
  const nextResults = [...toolResults];
  const existingFolders = new Set(
    nextCalls
      .filter((c) => c.name === "create_folder")
      .map((c) => String(c.arguments?.path || "").replace(/^\/+|\/+$/g, "")),
  );

  for (const tc of toolCalls) {
    if (
      tc.name === "create_note" ||
      tc.name === "edit_note" ||
      tc.name === "move_note"
    ) {
      const rawPath = String(
        tc.arguments?.path || tc.arguments?.toPath || "",
      ).trim();
      if (rawPath.includes("/")) {
        const folderPath = rawPath.split("/").slice(0, -1).join("/");
        if (folderPath && !existingFolders.has(folderPath)) {
          existingFolders.add(folderPath);
          const id = `folder_parent_${Date.now()}_${existingFolders.size}`;
          nextCalls.unshift({
            id,
            name: "create_folder",
            arguments: { path: folderPath },
          });
          nextResults.unshift({
            toolCallId: id,
            name: "create_folder",
            result: JSON.stringify({
              status: "applied",
              action: "create_folder",
              path: folderPath,
            }),
          });
        }
      }
    }
  }

  return { toolCalls: nextCalls, toolResults: nextResults };
}

export async function applyAndSyncCliVaultActions(params: {
  output: string;
  promptText: string;
  beforeNotes: string[];
  beforeFolders: string[];
  mutationBackend?: VaultMutationBackend;
  appendLog: (entry: string) => void;
}): Promise<VaultSyncResult> {
  const {
    output,
    promptText,
    beforeNotes,
    beforeFolders,
    mutationBackend,
    appendLog,
  } = params;

  const { calls: tagCalls, cleanedText } = parseVaultActionTags(output);
  const fallbackCalls =
    tagCalls.length > 0
      ? []
      : extractConversationalToolCalls(output, promptText);
  const plannedCalls = [...tagCalls, ...fallbackCalls];

  const toolCalls: AgentToolCall[] = [];
  const toolResults: AgentToolResult[] = [];

  if (mutationBackend && plannedCalls.length > 0) {
    for (const tc of plannedCalls) {
      const pathArg = String(tc.arguments?.path || "").trim();
      try {
        if (tc.name === "create_folder" && pathArg) {
          appendLog(`Creating folder "${pathArg}" in vault...`);
          if (mutationBackend.createFolder) {
            await mutationBackend.createFolder(pathArg);
          }
          appendLog(`✓ Applied create_folder on "${pathArg}"`);
        } else if (
          (tc.name === "create_note" || tc.name === "edit_note") &&
          pathArg
        ) {
          appendLog(`Creating note "${pathArg}" in vault...`);
          await mutationBackend.writeNote(
            pathArg,
            String(tc.arguments?.content ?? ""),
          );
          appendLog(`✓ Applied ${tc.name} on "${pathArg}"`);
        } else if (tc.name === "append_to_note" && pathArg) {
          appendLog(`Updating note "${pathArg}" in vault...`);
          const existing = mutationBackend.readNote
            ? ((await mutationBackend.readNote(pathArg)) ?? "")
            : "";
          const addition = String(tc.arguments?.content ?? "");
          await mutationBackend.writeNote(
            pathArg,
            existing ? `${existing}\n\n${addition}` : addition,
          );
          appendLog(`✓ Applied append_to_note on "${pathArg}"`);
        } else if (tc.name === "move_note") {
          const from = String(tc.arguments?.fromPath || "").trim();
          const to = String(tc.arguments?.toPath || "").trim();
          if (from && to && mutationBackend.moveNote) {
            appendLog(`Moving "${from}" → "${to}" in vault...`);
            await mutationBackend.moveNote(from, to);
            appendLog(`✓ Applied move_note on "${to}"`);
          }
        }
        toolCalls.push(tc);
        toolResults.push({
          toolCallId: tc.id,
          name: tc.name,
          result: JSON.stringify({
            status: "applied",
            action: tc.name,
            path: pathArg || tc.arguments?.toPath,
          }),
        });
      } catch (err) {
        appendLog(
          `Failed ${tc.name}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  // Detect any direct filesystem changes made by the CLI process on disk
  try {
    const [diskNotes, diskFolders] = await Promise.all([
      listNotes().catch(() => null),
      listFolders().catch(() => null),
    ]);
    const state = useWorkspaceStore.getState();
    if (Array.isArray(diskFolders)) {
      state.updateAllFolderPaths(
        Array.from(new Set([...state.allFolderPaths, ...diskFolders])).sort(),
      );
      for (const f of diskFolders) {
        if (
          !beforeFolders.includes(f) &&
          !toolCalls.some(
            (c) => c.name === "create_folder" && c.arguments?.path === f,
          )
        ) {
          const id = `cli_disk_folder_${Date.now()}_${f}`;
          toolCalls.push({ id, name: "create_folder", arguments: { path: f } });
          toolResults.push({
            toolCallId: id,
            name: "create_folder",
            result: JSON.stringify({
              status: "applied",
              action: "create_folder",
              path: f,
            }),
          });
          appendLog(`✓ Applied create_folder on "${f}"`);
        }
      }
    }
    if (Array.isArray(diskNotes)) {
      const validDiskNotes = diskNotes.filter(
        (n) => !isIgnoredAgentArtifact(n, promptText),
      );
      state.updateAllPaths(
        Array.from(new Set([...state.allNotePaths, ...validDiskNotes])).sort(),
      );
      for (const n of diskNotes) {
        if (isIgnoredAgentArtifact(n, promptText)) {
          if (mutationBackend?.deleteNote) {
            void mutationBackend.deleteNote(n).catch(() => {});
          }
          continue;
        }
        if (
          !beforeNotes.includes(n) &&
          !toolCalls.some(
            (c) =>
              (c.name === "create_note" || c.name === "edit_note") &&
              c.arguments?.path === n,
          )
        ) {
          const id = `cli_disk_note_${Date.now()}_${n}`;
          toolCalls.push({ id, name: "create_note", arguments: { path: n } });
          toolResults.push({
            toolCallId: id,
            name: "create_note",
            result: JSON.stringify({
              status: "applied",
              action: "create_note",
              path: n,
            }),
          });
          appendLog(`✓ Applied create_note on "${n}"`);
        }
      }
    }
  } catch {
    // Non-Tauri environment fallback
  }

  const enriched = ensureParentFolderToolCalls(toolCalls, toolResults);
  return {
    cleanedOutput: cleanedText || output,
    toolCalls: enriched.toolCalls,
    toolResults: enriched.toolResults,
  };
}
