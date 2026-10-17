import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecentInserts,
  getRecentInsertIds,
  recordRecentInsert,
  subscribeRecentInserts,
} from "./recentInsertStore";

describe("recentInsertStore", () => {
  beforeEach(() => {
    clearRecentInserts();
  });

  it("starts empty", () => {
    expect(getRecentInsertIds()).toEqual([]);
  });

  it("records items and maintains MRU order up to cap of 5", () => {
    recordRecentInsert("heading1");
    recordRecentInsert("table");
    recordRecentInsert("callout");

    expect(getRecentInsertIds()).toEqual(["callout", "table", "heading1"]);

    // Deduplication moves existing to the front
    recordRecentInsert("heading1");
    expect(getRecentInsertIds()).toEqual(["heading1", "callout", "table"]);

    // Cap at 5
    recordRecentInsert("code");
    recordRecentInsert("quote");
    recordRecentInsert("divider");

    expect(getRecentInsertIds()).toEqual([
      "divider",
      "quote",
      "code",
      "heading1",
      "callout",
    ]);
  });

  it("notifies subscribers when items are recorded or cleared", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRecentInserts(listener);

    recordRecentInsert("table");
    expect(listener).toHaveBeenCalledTimes(1);

    clearRecentInserts();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    recordRecentInsert("code");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
