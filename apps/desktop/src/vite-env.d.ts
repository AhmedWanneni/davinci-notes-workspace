/// <reference types="vite/client" />

declare const __FIXTURE_VAULT_PATH__: string;
declare const __LARGE_FIXTURE_VAULT_PATH__: string;

interface ImportMetaEnv {
  readonly VITE_GOOGLE_DRIVE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_SECRET?: string;
  readonly VITE_GOOGLE_DRIVE_CLIENT_SECRET?: string;
}
