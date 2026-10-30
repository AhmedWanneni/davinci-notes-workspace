import { describe, expect, it } from "vitest";
import { parseSseStream } from "./sseStream.js";

describe("parseSseStream", () => {
  it("yields json payloads from data lines and handles split chunks", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"chunk": 1}\n\n'));
        controller.enqueue(encoder.encode('data: {"ch'));
        controller.enqueue(encoder.encode('unk": 2}\n\ndata: [DONE]\n\n'));
        controller.close();
      },
    });

    const results: string[] = [];
    for await (const data of parseSseStream(stream)) {
      results.push(data);
    }

    expect(results).toEqual(['{"chunk": 1}', '{"chunk": 2}']);
  });
});
