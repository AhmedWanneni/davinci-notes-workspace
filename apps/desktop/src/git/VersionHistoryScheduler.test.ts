import { afterEach, describe, expect, it, vi } from "vitest";
import { VersionHistoryScheduler } from "./VersionHistoryScheduler";

describe("VersionHistoryScheduler", () => {
  afterEach(() => vi.useRealTimers());

  it("batches nearby saves into one automatic version", async () => {
    vi.useFakeTimers();
    const commit = vi.fn(async () => null);
    const scheduler = new VersionHistoryScheduler(2_000, commit);

    scheduler.recordAutoSave("one.md");
    scheduler.recordAutoSave("two.md");
    await vi.advanceTimersByTimeAsync(2_000);

    expect(commit).toHaveBeenCalledWith(["one.md", "two.md"], false);
  });

  it("flushes a manual version immediately", async () => {
    const commit = vi.fn(async () => null);
    const scheduler = new VersionHistoryScheduler(2_000, commit);

    await scheduler.saveVersionNow("note.md");

    expect(commit).toHaveBeenCalledWith(["note.md"], true);
  });
});
