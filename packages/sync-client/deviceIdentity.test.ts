import { describe, expect, it, vi } from "vitest";
import { getOrCreateDeviceId } from "./deviceIdentity";

describe("device identity", () => {
  it("persists the generated id and reuses it", async () => {
    let value: string | undefined;
    const storage = {
      read: vi.fn(async () => value),
      write: vi.fn(async (next: string) => {
        value = next;
      }),
    };
    const random = { randomBytes: () => new Uint8Array([1, 2, 3]) };
    const first = await getOrCreateDeviceId(storage, random);
    const second = await getOrCreateDeviceId(storage, random);
    expect(first).toBe(second);
    expect(storage.write).toHaveBeenCalledOnce();
  });
});
