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
import { codeBlockLanguage } from "../../../../packages/editor/codeBlockExtension";
import { markdownAnnotationsExtension } from "../../../../packages/editor/markdownAnnotationsExtension";
import { mermaidExtension } from "../../../../packages/editor/mermaidExtension";
import { mathExtension } from "../../../../packages/editor/mathExtension";

describe("Editor Performance Benchmark", () => {
  it("profiles document update with live preview and wikilink extensions", () => {
    // Construct a large document with 1000 lines, 100 wikilinks, 50 markdown links, and 50 images
    let docText = "# Large Document\n\n";
    for (let i = 0; i < 1000; i++) {
      if (i % 100 === 0) {
        docText += "```js\nconst value = **literal code**;\n```\n";
      } else if (i % 100 === 50) {
        docText += "```mermaid\ngraph TD\nA --> B\n```\n";
      } else if (i % 100 === 75) {
        docText += "Inline $e^{2i\\pi}=1$ math.\n";
      } else if (i % 20 === 0) {
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
        markdown({ codeLanguages: codeBlockLanguage }),
        livePreviewExtension,
        softLineBreakExtension,
        listExtension(),
        imageExtension(),
        markdownAnnotationsExtension(),
        mermaidExtension({ onLinkClick: () => {} }),
        mathExtension(),
        EditorView.lineWrapping,
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

  it("compares typing latency with Vim mode OFF vs Vim mode ON", async () => {
    let docText = "# Performance Comparison\n\n";
    for (let i = 0; i < 1000; i++) {
      docText += `Line ${i} with [[wikilink-${i % 50}]] and **bold text**.\n`;
    }

    const { loadVimExtension, attachVimModeListener } =
      await import("../../../../packages/editor/vimExtension");
    const vimExt = await loadVimExtension();

    // 1. Measure Vim Mode OFF
    const containerOff = document.createElement("div");
    document.body.appendChild(containerOff);
    const viewOff = new EditorView({
      state: EditorState.create({
        doc: docText,
        extensions: [
          markdown({ codeLanguages: codeBlockLanguage }),
          livePreviewExtension,
          wikilinkExtension({
            notePaths: Array.from({ length: 350 }, (_, i) => `note-${i}.md`),
            sourcePath: "active-note.md",
            onLinkClick: () => {},
          }),
        ],
      }),
      parent: containerOff,
    });

    const startOff = performance.now();
    for (let i = 0; i < 100; i++) {
      viewOff.dispatch({
        changes: { from: viewOff.state.doc.length, insert: "x" },
      });
    }
    const latencyOff = (performance.now() - startOff) / 100;
    viewOff.destroy();
    containerOff.remove();

    // 2. Measure Vim Mode ON
    const containerOn = document.createElement("div");
    document.body.appendChild(containerOn);
    const viewOn = new EditorView({
      state: EditorState.create({
        doc: docText,
        extensions: [
          markdown({ codeLanguages: codeBlockLanguage }),
          livePreviewExtension,
          wikilinkExtension({
            notePaths: Array.from({ length: 350 }, (_, i) => `note-${i}.md`),
            sourcePath: "active-note.md",
            onLinkClick: () => {},
          }),
          vimExt,
        ],
      }),
      parent: containerOn,
    });

    let currentMode: string | null = null;
    const cleanup = attachVimModeListener(viewOn, (mode) => {
      currentMode = mode;
    });

    const startOn = performance.now();
    for (let i = 0; i < 100; i++) {
      viewOn.dispatch({
        changes: { from: viewOn.state.doc.length, insert: "y" },
      });
    }
    const latencyOn = (performance.now() - startOn) / 100;

    console.info(`\n=== VIM MODE TYPING LATENCY COMPARISON ===`);
    console.info(
      `Vim Mode OFF average keystroke latency: ${latencyOff.toFixed(3)} ms`,
    );
    console.info(
      `Vim Mode ON average keystroke latency:  ${latencyOn.toFixed(3)} ms`,
    );
    console.info(
      `Delta latency:                         ${(latencyOn - latencyOff).toFixed(3)} ms`,
    );
    console.info(`==========================================\n`);

    cleanup?.();
    viewOn.destroy();
    containerOn.remove();

    expect(latencyOff).toBeLessThan(50);
    expect(latencyOn).toBeLessThan(50);
    expect(currentMode).toBeDefined();
  }, 15000);
});
