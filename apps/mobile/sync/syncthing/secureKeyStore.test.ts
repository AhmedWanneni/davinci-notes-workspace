import { describe, expect, it, beforeEach } from "vitest";
import {
  getSyncthingApiKey,
  setSyncthingApiKey,
  clearSyncthingApiKey,
} from "./secureKeyStore";
import { resetMockSecureStore } from "../../tests/mocks/expoSecureStoreMock";

describe("secureKeyStore", () => {
  beforeEach(() => {
    resetMockSecureStore();
  });

  it("returns null when no API key is stored", async () => {
    const key = await getSyncthingApiKey();
    expect(key).toBeNull();
  });

  it("stores and retrieves the API key securely", async () => {
    const testKey = "abc-123-syncthing-secret";
    await setSyncthingApiKey(testKey);

    const loaded = await getSyncthingApiKey();
    expect(loaded).toBe(testKey);
  });

  it("clears key when empty string is set or when clearSyncthingApiKey is called", async () => {
    await setSyncthingApiKey("temp-key");
    expect(await getSyncthingApiKey()).toBe("temp-key");

    await clearSyncthingApiKey();
    expect(await getSyncthingApiKey()).toBeNull();

    await setSyncthingApiKey("temp-key-2");
    await setSyncthingApiKey("   ");
    expect(await getSyncthingApiKey()).toBeNull();
  });
});
