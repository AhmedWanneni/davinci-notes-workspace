import { useCallback } from "react";
import { pastedFileName } from "@app/editor";
import { resolveAttachmentFolder } from "@app/attachments";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";
import {
  createFolder,
  writeAttachmentToVault,
  writeBinaryFile,
} from "../../vault";
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
      const isImage =
        file.type.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(file.name);
      let folder = resolveAttachmentFolder(activeNotePath, attachmentSettings);

      if (isImage) {
        folder = "images";
        const { allFolderPaths, updateAllFolderPaths } =
          useWorkspaceStore.getState();
        const folderExists = allFolderPaths.some(
          (f) =>
            f.toLowerCase() === "images" || f.toLowerCase().endsWith("/images"),
        );
        if (!folderExists) {
          try {
            await createFolder("images");
          } catch {
            // Folder may already exist on disk
          }
          if (!allFolderPaths.includes("images")) {
            updateAllFolderPaths([...allFolderPaths, "images"].sort());
          }
        }
      }

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
      const normalizedTarget = linkTarget.replaceAll("\\", "/");
      const currentPaths = useWorkspaceStore.getState().allNotePaths;
      if (!currentPaths.includes(normalizedTarget)) {
        useWorkspaceStore
          .getState()
          .updateAllPaths([...currentPaths, normalizedTarget]);
      }
      return `![[${normalizedTarget}]]`;
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
        filePath.startsWith("https://") ||
        filePath.startsWith("asset://")
      ) {
        return filePath;
      }
      const isAbsolute =
        filePath.startsWith("/") || /^[a-zA-Z]:[/\\]/.test(filePath);
      const absolutePath = isAbsolute
        ? filePath
        : vaultPath
          ? `${vaultPath.replace(/\/+$/, "")}/${filePath.replace(/^\/+/, "")}`
          : filePath;
      try {
        if (hasPlatformAdapters()) {
          return getPlatformAdapters().fs.resolveFileUrl(absolutePath);
        }
        return filePath;
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
