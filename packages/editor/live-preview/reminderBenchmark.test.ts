// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { reminderExtension } from "./reminderExtension";
import { reminderTheme } from "../theme/reminderTheme";
import { livePreviewExtension } from "./livePreviewExtension";
import { listExtension } from "./listExtension";

describe("Reminder Benchmark — 5,000-line note with 200 reminders", () => {
  it("measures keystroke latency before and after reminderExtension", () => {
    // Generate 5,000 lines with 200 reminders evenly distributed (every 25 lines)
    const lines: string[] = [];
    let reminderCount = 0;

    for (let i = 1; i <= 5000; i++) {
      if (i % 25 === 0 && reminderCount < 200) {
        reminderCount++;
        const isDone = reminderCount % 2 === 0 ? "x" : " ";
        lines.push(
          `- [${isDone}] Follow up task ${reminderCount} (@2026-10-15 14:30)`,
        );
      } else if (i % 50 === 0) {
        lines.push(`## Section Heading ${i / 50}`);
      } else if (i % 100 === 0) {
        lines.push("```ts\nconst x = 42;\n```");
      } else {
        lines.push(
          `This is line ${i} of note content for testing editor performance with many lines.`,
        );
      }
    }

    const docText = lines.join("\n");
    expect(reminderCount).toBe(200);

    const baseExtensions = [markdown(), livePreviewExtension, listExtension()];

    // --- Benchmark 1: BEFORE adding reminderExtension ---
    const containerBefore = document.createElement("div");
    document.body.appendChild(containerBefore);

    const stateBefore = EditorState.create({
      doc: docText,
      extensions: baseExtensions,
    });
    const viewBefore = new EditorView({
      state: stateBefore,
      parent: containerBefore,
    });

    const iterations = 100;
    const t0Before = performance.now();
    for (let i = 0; i < iterations; i++) {
      viewBefore.dispatch({
        changes: { from: viewBefore.state.doc.length, insert: "x" },
      });
    }
    const durationBefore = performance.now() - t0Before;
    const latencyBefore = durationBefore / iterations;

    viewBefore.destroy();
    containerBefore.remove();

    // --- Benchmark 2: AFTER adding reminderExtension + reminderTheme ---
    const containerAfter = document.createElement("div");
    document.body.appendChild(containerAfter);

    const stateAfter = EditorState.create({
      doc: docText,
      extensions: [...baseExtensions, reminderTheme, reminderExtension()],
    });
    const viewAfter = new EditorView({
      state: stateAfter,
      parent: containerAfter,
    });

    const t0After = performance.now();
    for (let i = 0; i < iterations; i++) {
      viewAfter.dispatch({
        changes: { from: viewAfter.state.doc.length, insert: "x" },
      });
    }
    const durationAfter = performance.now() - t0After;
    const latencyAfter = durationAfter / iterations;

    viewAfter.destroy();
    containerAfter.remove();

    console.info(`\n=== 5,000-LINE NOTE BENCHMARK (200 REMINDERS) ===`);
    console.info(
      `Lines: 5,000 | Reminders: 200 | Typed characters: ${iterations}`,
    );
    console.info(
      `Before reminderExtension: ${durationBefore.toFixed(2)} ms total (${latencyBefore.toFixed(3)} ms/keystroke)`,
    );
    console.info(
      `After reminderExtension:  ${durationAfter.toFixed(2)} ms total (${latencyAfter.toFixed(3)} ms/keystroke)`,
    );
    console.info(
      `Delta: ${(latencyAfter - latencyBefore).toFixed(3)} ms/keystroke`,
    );

    // Verify both are well under the 5ms keystroke budget
    expect(latencyAfter).toBeLessThan(5.0);
  });
});
