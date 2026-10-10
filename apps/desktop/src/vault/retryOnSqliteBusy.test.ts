import { describe, it, expect, vi } from "vitest";
import { retryOnSqliteBusy, isSqliteBusyError } from "./retryOnSqliteBusy";

describe("isSqliteBusyError", () => {
  it("identifies code 5 errors", () => {
    expect(
      isSqliteBusyError(
        new Error("error returned from database: (code: 5) database is locked"),
      ),
    ).toBe(true);
  });

  it("identifies database is locked text", () => {
    expect(isSqliteBusyError(new Error("database is locked"))).toBe(true);
  });

  it("identifies SQLite busy error", () => {
    expect(isSqliteBusyError(new Error("SQLITE_BUSY: database is busy"))).toBe(
      true,
    );
  });

  it("rejects unrelated errors", () => {
    expect(isSqliteBusyError(new Error("syntax error"))).toBe(false);
    expect(isSqliteBusyError(null)).toBe(false);
  });
});

describe("retryOnSqliteBusy", () => {
  it("returns result immediately on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retryOnSqliteBusy(fn, 3, 10);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on locked error and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("(code: 5) database is locked"))
      .mockResolvedValue("recovered");

    const result = await retryOnSqliteBusy(fn, 3, 5);
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("fails after exceeding max retries", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new Error("(code: 5) database is locked"));

    await expect(retryOnSqliteBusy(fn, 2, 5)).rejects.toThrow(
      "database is locked",
    );
    expect(fn).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
  });

  it("fails immediately on non-busy errors without retrying", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("table not found"));

    await expect(retryOnSqliteBusy(fn, 3, 5)).rejects.toThrow(
      "table not found",
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
