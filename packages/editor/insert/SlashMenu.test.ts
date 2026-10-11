import { describe, expect, it } from "vitest";
import { isSlashMenuTrigger } from "./SlashMenu";

describe("isSlashMenuTrigger", () => {
  it("allows a line start and whitespace", () => {
    expect(isSlashMenuTrigger("", true)).toBe(true);
    expect(isSlashMenuTrigger("text ", true)).toBe(true);
  });
  it("rejects word, path, disabled, and Vim normal contexts", () => {
    expect(isSlashMenuTrigger("and", true)).toBe(false);
    expect(isSlashMenuTrigger("a", true)).toBe(false);
    expect(isSlashMenuTrigger("", false)).toBe(false);
    expect(isSlashMenuTrigger("", true, "NORMAL")).toBe(false);
  });
});
