import { useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { pastedFileName } from "@app/editor";
import { resolveAttachmentFolder } from "@app/attachments";
import { writeAttachmentToVault, writeBinaryFile } from "../../vault";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export function useEditorMediaHandlers(activeNotePath: string | null) {
  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const attachmentSettings = useWorkspaceStore(
    (state) => state.attachmentSettings,
  );

  const handlePasteAttachment = useCallback(
    async (file: File): Promise<string> => {
      if (!vaultPath || !activeNotePath) {
        throw new Error("Open a vault and note before pasting an attachment.");
      }
      const folder = resolveAttachmentFolder(
        activeNotePath,
        attachmentSettings,
      );
      const writtenPath = await writeAttachmentToVault(
        vaultPath,
        folder,
        pastedFileName(file),
        file,
      );
      const vaultPrefix = `${vaultPath.replaceAll("\\", "/").replace(/\/+$/u, "")}/`;
      const linkTarget = writtenPath.startsWith(vaultPrefix)
        ? writtenPath.slice(vaultPrefix.length)
        : writtenPath;
      return `![[${linkTarget.replaceAll("\\", "/")}]]`;
    },
    [activeNotePath, attachmentSettings, vaultPath],
  );

  const handleAttachmentError = useCallback((message: string) => {
    window.alert(`Attachment paste failed: ${message}`);
  }, []);

  const handleResolveMediaUrl = useCallback(
    (filePath: string) => {
      if (
        !filePath ||
        filePath.startsWith("data:") ||
        filePath.startsWith("blob:") ||
        filePath.startsWith("http://") ||
        filePath.startsWith("https://")
      ) {
        return filePath;
      }
      const absolutePath = vaultPath
        ? `${vaultPath.replace(/\/+$/, "")}/${filePath.replace(/^\/+/, "")}`
        : filePath;
      try {
        return convertFileSrc(absolutePath);
      } catch {
        return filePath;
      }
    },
    [vaultPath],
  );

  const handleSaveMediaFile = useCallback(
    async (fileName: string, data: Uint8Array): Promise<string> => {
      await writeBinaryFile(fileName, data);
      const currentPaths = useWorkspaceStore.getState().allNotePaths;
      if (!currentPaths.includes(fileName)) {
        useWorkspaceStore
          .getState()
          .updateAllPaths([...currentPaths, fileName]);
      }
      return fileName;
    },
    [],
  );

  return {
    handlePasteAttachment,
    handleAttachmentError,
    handleResolveMediaUrl,
    handleSaveMediaFile,
  };
}
