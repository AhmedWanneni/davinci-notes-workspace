const secureStorage = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  return secureStorage.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  secureStorage.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  secureStorage.delete(key);
}

export function resetMockSecureStore(): void {
  secureStorage.clear();
}
