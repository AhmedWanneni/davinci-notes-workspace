// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { livePreviewExtension } from "../../../../packages/editor/livePreviewExtension";
import { wikilinkExtension } from "../../../../packages/editor/wikilinkExtension";
import { imageExtension } from "../../../../packages/editor/imageExtension";
import { listExtension } from "../../../../packages/editor/listExtension";
import { softLineBreakExtension } from "../../../../packages/editor/lineBreakExtension";

describe("Editor Performance Benchmark", () => {
  it("profiles document update with live preview and wikilink extensions", () => {
    // Construct a large document with 1000 lines, 100 wikilinks, 50 markdown links, and 50 images
    let docText = "# Large Document\n\n";
    for (let i = 0; i < 1000; i++) {
      if (i % 20 === 0) {
        docText += `This is line ${i} with a [[wikilink-${i}]] and some **bold text**.\n`;
      } else if (i % 20 === 10) {
        docText += `This is line ${i} with a [markdown link](note-${i}.md) and ![photo|300x200](https://example.com/pic-${i}.png).\n`;
      } else if (i % 20 === 5) {
        docText += `  - [${i % 40 === 5 ? " " : "?"}] Task ${i} with **formatting**\n`;
      } else {
        docText += `This is normal line ${i} of text in our editor performance test.\n`;
      }
    }

    const state = EditorState.create({
      doc: docText,
      extensions: [
        markdown(),
        livePreviewExtension,
        softLineBreakExtension,
        listExtension(),
        imageExtension(),
        wikilinkExtension({
          notePaths: Array.from({ length: 350 }, (_, i) => `note-${i}.md`),
          sourcePath: "active-note.md",
          onLinkClick: () => {},
        }),
      ],
    });

    const container = document.createElement("div");
    document.body.appendChild(container);

    const view = new EditorView({ state, parent: container });

    // Measure keypress / typing dispatch transaction latency
    const start = performance.now();
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      // Simulate typing a character at the end of the document
      view.dispatch({
        changes: { from: view.state.doc.length, insert: "a" },
      });
    }
    const duration = performance.now() - start;
    const latencyPerChar = duration / iterations;

    console.info(`\n=== EDITOR TYPING LATENCY BENCHMARK ===`);
    console.info(`Document Size: ${docText.length} characters (1,000 lines)`);
    console.info(`Wikilinks Count: 100 links`);
    console.info(`Vault File Count: 350 notes`);
    console.info(
      `Total duration for ${iterations} typed characters: ${duration.toFixed(2)} ms`,
    );
    console.info(
      `Average latency per keystroke transaction: ${latencyPerChar.toFixed(3)} ms`,
    );
    console.info(`=======================================\n`);

    expect(latencyPerChar).toBeLessThan(5);

    view.destroy();
    document.body.removeChild(container);
  });
});
