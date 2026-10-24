import type { SecretStoreAdapter } from "../SecretStoreAdapter";

const SECRET_PREFIX = "davinci:secret:";

export class WebSecretStoreAdapter implements SecretStoreAdapter {
  private readonly memoryFallback = new Map<string, string>();

  async getSecret(key: string): Promise<string | null> {
    const storageKey = `${SECRET_PREFIX}${key}`;
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const val = window.sessionStorage.getItem(storageKey);
        if (val !== null) return val;
      } catch {
        // Fallback to memory
      }
    }
    return this.memoryFallback.get(key) ?? null;
  }

  async setSecret(key: string, value: string): Promise<void> {
    const storageKey = `${SECRET_PREFIX}${key}`;
    this.memoryFallback.set(key, value);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(storageKey, value);
      } catch {
        // Ignore storage quota errors
      }
    }
  }

  async clearSecret(key: string): Promise<void> {
    const storageKey = `${SECRET_PREFIX}${key}`;
    this.memoryFallback.delete(key);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }
}
