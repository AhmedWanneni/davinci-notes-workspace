import { describe, it, expect } from "vitest";
import {
  parseMemoryData,
  serializeMemoryData,
  addMemoryEntry,
  deleteMemoryEntry,
  formatMemoryPrompt,
} from "./agentMemory.js";

describe("agentMemory", () => {
  it("parses empty or invalid json safely", () => {
    expect(parseMemoryData(null)).toEqual({ version: 1, entries: [] });
    expect(parseMemoryData("invalid json")).toEqual({ version: 1, entries: [] });
  });

  it("adds and serializes new memory entries", () => {
    const initial = parseMemoryData(null);
    const { data: updated, entry } = addMemoryEntry(
      initial,
      "User prefers concise summary notes",
      "preference",
    );

    expect(updated.entries.length).toBe(1);
    expect(entry.content).toBe("User prefers concise summary notes");
    expect(entry.category).toBe("preference");

    const json = serializeMemoryData(updated);
    const roundTrip = parseMemoryData(json);
    expect(roundTrip.entries.length).toBe(1);
    expect(roundTrip.entries[0].content).toBe("User prefers concise summary notes");
  });

  it("deduplicates identical memory contents", () => {
    const initial = parseMemoryData(null);
    const step1 = addMemoryEntry(initial, "Project alpha deadline is Friday");
    const step2 = addMemoryEntry(step1.data, "project alpha deadline is friday");
    expect(step2.data.entries.length).toBe(1);
  });

  it("formats memory prompt block cleanly", () => {
    let data = parseMemoryData(null);
    data = addMemoryEntry(data, "Prefers markdown tables", "preference").data;
    data = addMemoryEntry(data, "Studying computer graphics", "project").data;

    const promptBlock = formatMemoryPrompt(data);
    expect(promptBlock).toContain("AGENT LONG-TERM MEMORY");
    expect(promptBlock).toContain("- [preference] Prefers markdown tables");
    expect(promptBlock).toContain("- [project] Studying computer graphics");
  });

  it("deletes a memory entry by id", () => {
    let data = parseMemoryData(null);
    const res = addMemoryEntry(data, "Temporary note");
    expect(res.data.entries.length).toBe(1);

    const deleted = deleteMemoryEntry(res.data, res.entry.id);
    expect(deleted.entries.length).toBe(0);
  });
});
