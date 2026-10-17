import * as SecureStore from "expo-secure-store";

const SYNCTHING_SECURE_KEY = "davinci_syncthing_api_key";

/**
 * Retrieves the Syncthing API key securely from expo-secure-store.
 * Returns null if not configured or on failure.
 */
export async function getSyncthingApiKey(): Promise<string | null> {
  try {
    const key = await SecureStore.getItemAsync(SYNCTHING_SECURE_KEY);
    return key && key.trim().length > 0 ? key.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Persists the Syncthing API key to expo-secure-store.
 * The key is never logged or stored in unencrypted storage.
 */
export async function setSyncthingApiKey(apiKey: string): Promise<void> {
  const clean = apiKey.trim();
  if (clean.length === 0) {
    await clearSyncthingApiKey();
    return;
  }
  await SecureStore.setItemAsync(SYNCTHING_SECURE_KEY, clean, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Removes the Syncthing API key from expo-secure-store.
 */
export async function clearSyncthingApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SYNCTHING_SECURE_KEY);
  } catch {
    // Ignore deletion errors if key did not exist
  }
}
