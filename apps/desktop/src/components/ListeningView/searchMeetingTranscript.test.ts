import { describe, it, expect } from "vitest";
import { searchMeetingTranscript } from "./searchMeetingTranscript";
import type { TranscriptSegmentItem } from "./listeningTypes";

describe("searchMeetingTranscript", () => {
  const sampleSegments: TranscriptSegmentItem[] = [
    {
      id: "seg-1",
      speaker: "Alice",
      text: "We decided to launch the beta release on November 15th.",
      timestampMs: 12000,
    },
    {
      id: "seg-2",
      speaker: "Bob",
      text: "The authentication service needs a database migration first.",
      timestampMs: 25000,
    },
    {
      id: "seg-3",
      speaker: "Alice",
      text: "Agreed, let's make sure SQLite WAL mode is enabled for migrations.",
      timestampMs: 40000,
    },
  ];

  it("returns empty array for empty query or empty segments", async () => {
    expect(await searchMeetingTranscript([], "launch")).toEqual([]);
    expect(await searchMeetingTranscript(sampleSegments, "")).toEqual([]);
    expect(await searchMeetingTranscript(sampleSegments, "   ")).toEqual([]);
  });

  it("finds exact-detail matches in raw transcript", async () => {
    const results = await searchMeetingTranscript(sampleSegments, "November 15th");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].speaker).toBe("Alice");
    expect(results[0].text).toContain("November 15th");
  });

  it("finds matching terms across multiple segments ranked by relevance", async () => {
    const results = await searchMeetingTranscript(sampleSegments, "SQLite migration");
    expect(results.length).toBe(2);
    expect(results.some((r) => r.text.includes("WAL mode"))).toBe(true);
    expect(results.some((r) => r.text.includes("authentication service"))).toBe(true);
  });
});
