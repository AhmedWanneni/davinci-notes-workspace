import type {
  DialogAdapter,
  DialogConfirmOptions,
  FilePickResult,
  FolderPickResult,
} from "@app/platform-adapters";
import { confirm, message, open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

export class TauriDialogAdapter implements DialogAdapter {
  async pickVaultFolder(): Promise<FolderPickResult | null> {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open vault folder",
    });

    if (selected === null) {
      return null;
    }

    const folderPath = Array.isArray(selected) ? (selected[0] ?? null) : selected;
    if (!folderPath) return null;
    const name = folderPath.split(/[/\\]/).filter(Boolean).pop() ?? folderPath;
    return { path: folderPath, name };
  }

  async pickImageFile(): Promise<FilePickResult | null> {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Images",
          extensions: [
            "png",
            "jpg",
            "jpeg",
            "gif",
            "webp",
            "svg",
            "bmp",
            "avif",
          ],
        },
      ],
    });

    if (!selected || typeof selected !== "string") {
      return null;
    }

    const data = await readFile(selected);
    const name = selected.split(/[/\\]/).filter(Boolean).pop() ?? "image.png";

    return {
      name,
      path: selected,
      data,
    };
  }

  async confirm(options: DialogConfirmOptions): Promise<boolean> {
    return confirm(options.message, {
      title: options.title,
      okLabel: options.okLabel,
      cancelLabel: options.cancelLabel,
    });
  }

  async alert(msg: string, title?: string): Promise<void> {
    await message(msg, { title });
  }
}
