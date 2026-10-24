import { describe, expect, it } from "vitest";
import type { StorageArea } from "../storage/storageArea";
import {
  clearPairing,
  DEFAULT_CLIPPER_PORT,
  PAIRING_KEY,
  loadPairing,
  pairingFromStorageValue,
  parsePort,
  savePairing,
} from "./pairingStore";

function memoryStorage(initial: Record<string, unknown> = {}): StorageArea & {
  data: Record<string, unknown>;
} {
  const data = { ...initial };
  return {
    data,
    async get(keys) {
      if (keys === null) return { ...data };
      const list = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, unknown> = {};
      for (const key of list) if (key in data) result[key] = data[key];
      return result;
    },
    async set(items) {
      Object.assign(data, items);
    },
  };
}

describe("pairingFromStorageValue", () => {
  it("accepts a well-formed pairing and trims the token", () => {
    expect(
      pairingFromStorageValue({ port: 47912, token: "  abc123  " }),
    ).toEqual({ port: 47912, token: "abc123" });
  });

  it("reads an absent or cleared entry as unpaired", () => {
    expect(pairingFromStorageValue(undefined)).toBeUndefined();
    expect(pairingFromStorageValue(null)).toBeUndefined();
    expect(pairingFromStorageValue({})).toBeUndefined();
  });

  it("refuses a half-written entry rather than repairing it", () => {
    expect(pairingFromStorageValue({ token: "abc" })).toBeUndefined();
    expect(pairingFromStorageValue({ port: 47912 })).toBeUndefined();
    expect(
      pairingFromStorageValue({ port: 47912, token: "   " }),
    ).toBeUndefined();
    expect(pairingFromStorageValue({ port: 0, token: "abc" })).toBeUndefined();
    expect(
      pairingFromStorageValue({ port: 70_000, token: "abc" }),
    ).toBeUndefined();
    expect(
      pairingFromStorageValue({ port: 4.5, token: "abc" }),
    ).toBeUndefined();
    expect(
      pairingFromStorageValue({ port: "47912", token: "abc" }),
    ).toBeUndefined();
    expect(pairingFromStorageValue("47912:abc")).toBeUndefined();
  });
});

describe("parsePort", () => {
  it("reads a usable port out of the typed text", () => {
    expect(parsePort("47912")).toBe(47912);
    expect(parsePort("  8080 ")).toBe(8080);
    expect(parsePort("1")).toBe(1);
    expect(parsePort("65535")).toBe(65535);
  });

  it("refuses anything that is not a port", () => {
    expect(parsePort("")).toBeUndefined();
    expect(parsePort("0")).toBeUndefined();
    expect(parsePort("65536")).toBeUndefined();
    expect(parsePort("47912.5")).toBeUndefined();
    expect(parsePort("-1")).toBeUndefined();
    expect(parsePort("http://127.0.0.1:47912")).toBeUndefined();
  });
});

describe("pairing store", () => {
  it("round-trips a pairing through storage", async () => {
    const area = memoryStorage();
    await savePairing(area, { port: 47912, token: "abc123" });

    expect(area.data[PAIRING_KEY]).toEqual({ port: 47912, token: "abc123" });
    expect(await loadPairing(area)).toEqual({ port: 47912, token: "abc123" });
  });

  it("stores nothing when the pairing is unusable", async () => {
    const area = memoryStorage();
    await savePairing(area, { port: 0, token: "abc123" });

    expect(area.data).toEqual({});
    expect(await loadPairing(area)).toBeUndefined();
  });

  it("reads an empty storage as unpaired", async () => {
    expect(await loadPairing(memoryStorage())).toBeUndefined();
  });

  it("reads a cleared pairing as unpaired", async () => {
    const area = memoryStorage();
    await savePairing(area, { port: 47912, token: "abc123" });

    await clearPairing(area);

    expect(await loadPairing(area)).toBeUndefined();
  });

  it("ignores a hand-edited entry that storage returned", async () => {
    const area = memoryStorage({ [PAIRING_KEY]: { port: 47912, token: 7 } });

    expect(await loadPairing(area)).toBeUndefined();
  });

  it("pairs on the app's preferred port by default", () => {
    expect(DEFAULT_CLIPPER_PORT).toBe(47912);
  });
});
