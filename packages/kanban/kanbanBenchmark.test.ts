import { describe, it, expect } from "vitest";
import { parseBoard } from "./parseBoard";
import { serializeBoard } from "./serializeBoard";
import { toggleCard } from "./cardOperations";

describe("Part 1: Performance Benchmark — 5,000-Card Board", () => {
  it("measures parse, serialize, and mutation time for 5,000 cards", () => {
    const lanesCount = 10;
    const cardsPerLane = 500; // Total 5,000 cards
    const lines = ["---", "kanban-plugin: board", "---", ""];

    for (let l = 0; l < lanesCount; l += 1) {
      lines.push(`## Lane ${l + 1}`);
      for (let c = 0; c < cardsPerLane; c += 1) {
        lines.push(
          `- [ ] Task ${l}-${c} with [[Link-${c % 100}]] and #tag-${c % 20}`,
        );
      }
      lines.push("");
    }

    const largeDoc = lines.join("\n");

    const t0 = performance.now();
    const board = parseBoard(largeDoc);
    const parseTimeMs = performance.now() - t0;

    expect(board.lanes).toHaveLength(lanesCount);
    let totalCards = 0;
    for (const lane of board.lanes) {
      totalCards += lane.cards.length;
    }
    expect(totalCards).toBe(5000);

    const t1 = performance.now();
    const roundTripDoc = serializeBoard(board);
    const unmodifiedSerializeMs = performance.now() - t1;
    expect(roundTripDoc).toBe(largeDoc);

    // Modify a card to benchmark modified serialization time
    const t2 = performance.now();
    toggleCard(board, board.lanes[0].cards[0].id);
    const modifiedDoc = serializeBoard(board);
    const modifiedSerializeMs = performance.now() - t2;

    expect(modifiedDoc).not.toBe(largeDoc);
    expect(modifiedDoc).toContain("- [x] Task 0-0");

    console.log(`
=== KANBAN 5,000-CARD BENCHMARK ===
Parse time:               ${parseTimeMs.toFixed(2)} ms
Unmodified serialize:     ${unmodifiedSerializeMs.toFixed(2)} ms
Modified serialize (5k):  ${modifiedSerializeMs.toFixed(2)} ms
Total cards parsed:       ${totalCards}
===================================
    `);

    // Ensure parse time is well within budget (< 100ms for 5,000 cards)
    expect(parseTimeMs).toBeLessThan(100);
    expect(modifiedSerializeMs).toBeLessThan(100);
  });
});
