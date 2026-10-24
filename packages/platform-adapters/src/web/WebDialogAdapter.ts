import type {
  DialogAdapter,
  DialogConfirmOptions,
  FilePickResult,
  FolderPickResult,
} from "../DialogAdapter";
import { getPlatformAdapters, hasPlatformAdapters, setPlatformAdapters } from "../PlatformContext";
import {
  FileSystemAccessAdapter,
  type DirectoryHandleLike,
} from "./FileSystemAccessAdapter";

export class WebDialogAdapter implements DialogAdapter {
  async pickVaultFolder(): Promise<FolderPickResult | null> {
    if (
      typeof window !== "undefined" &&
      "showDirectoryPicker" in window &&
      typeof (
        window as unknown as {
          showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
        }
      ).showDirectoryPicker === "function"
    ) {
      try {
        const picker = (
          window as unknown as {
            showDirectoryPicker: (options?: {
              mode?: string;
            }) => Promise<DirectoryHandleLike>;
          }
        ).showDirectoryPicker;
        const handle = await picker({ mode: "readwrite" });
        if (hasPlatformAdapters()) {
          const current = getPlatformAdapters();
          setPlatformAdapters({
            ...current,
            fs: new FileSystemAccessAdapter(handle),
          });
        }
        return {
          path: `fsa://${handle.name}`,
          name: handle.name,
        };
      } catch {
        return null;
      }
    }
    return {
      path: "opfs://default-vault",
      name: "DaVinci Web Vault",
    };
  }

  async pickImageFile(): Promise<FilePickResult | null> {
    if (typeof document === "undefined") return null;

    return new Promise<FilePickResult | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/gif,image/webp,image/svg+xml";

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const buf = await file.arrayBuffer();
        resolve({
          name: file.name,
          data: new Uint8Array(buf),
        });
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  async confirm(options: DialogConfirmOptions): Promise<boolean> {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      return window.confirm(options.message);
    }
    return true;
  }

  async alert(message: string, _title?: string): Promise<void> {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    }
  }
}
