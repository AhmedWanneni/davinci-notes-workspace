import * as SecureStore from "expo-secure-store";
import type { OAuthToken, TokenStore } from "@app/sync-client";

const SECURE_STORE_KEY = "davinci_drive_oauth_token";

export class MobileSecureTokenStore implements TokenStore {
  async load(): Promise<OAuthToken | null> {
    try {
      const raw = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as OAuthToken;
      if (!parsed.accessToken || !parsed.expiresAt) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async save(token: OAuthToken): Promise<void> {
    try {
      // Tokens must never appear in unencrypted logs or plaintext storage
      await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(token));
    } catch (err) {
      throw new Error(
        `Failed to save drive token to secure storage: ${String(err)}`,
      );
    }
  }

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    } catch {
      // Ignore if key was already absent
    }
  }
}

export const defaultSecureTokenStore = new MobileSecureTokenStore();
