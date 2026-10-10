import { describe, expect, it } from "vitest";
import { queuePerPath } from "./saveQueue";

describe("queuePerPath", () => {
  it("serializes tasks for the same path in arrival order", async () => {
    const order: number[] = [];
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const p1 = queuePerPath("note.md", async () => {
      await delay(20);
      order.push(1);
      return 1;
    });

    const p2 = queuePerPath("note.md", async () => {
      await delay(5);
      order.push(2);
      return 2;
    });

    const p3 = queuePerPath("other.md", async () => {
      await delay(10);
      order.push(3);
      return 3;
    });

    await Promise.all([p1, p2, p3]);

    // Note 1 completes first, then Note 2 (even though delay for 2 was shorter)
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(2));
  });

  it("recovers and runs subsequent tasks even if a prior task throws", async () => {
    const errorTask = queuePerPath("failing.md", async () => {
      throw new Error("Disk failure");
    });

    await expect(errorTask).rejects.toThrow("Disk failure");

    const recoveryTask = queuePerPath("failing.md", async () => "recovered");
    await expect(recoveryTask).resolves.toBe("recovered");
  });
});
