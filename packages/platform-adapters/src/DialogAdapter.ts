export interface FolderPickResult {
  path: string;
  name: string;
}

export interface FilePickResult {
  name: string;
  path?: string;
  data: Uint8Array;
}

export interface DialogConfirmOptions {
  title?: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
}

export interface DialogAdapter {
  pickVaultFolder(): Promise<FolderPickResult | null>;
  pickImageFile(): Promise<FilePickResult | null>;
  confirm(options: DialogConfirmOptions): Promise<boolean>;
  alert(message: string, title?: string): Promise<void>;
}
