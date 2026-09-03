export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  author: string;
  description: string;
  styles: string;
  authorUrl?: string;
  license?: string;
  keywords?: string[];
}

export interface ThemeValidationError {
  field: string;
  message: string;
}

export type ThemeValidationResult =
  | { success: true; data: ThemeManifest }
  | { success: false; errors: ThemeValidationError[] };
