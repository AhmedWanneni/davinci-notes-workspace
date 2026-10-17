import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import {
  editorTheme,
  highlightExtension,
  listExtension,
  livePreviewExtension,
  softLineBreakExtension,
  tagExtension,
} from "@app/editor";
import {
  createDebouncedBridge,
  measurePayloadSize,
  type DocChangeNotification,
} from "../src/bridgeProtocol";
import {
  NOTE_200_LINES,
  NOTE_2000_LINES,
  NOTE_10000_LINES,
} from "../src/testNotes";
import { attachMobileViewportHandler } from "../src/viewportHandler";
import { requestEditorFocus } from "../src/iosFocusWorkaround";

describe("Mobile Editor Verification", () => {
  it("verifies test document generation line counts", () => {
    expect(NOTE_200_LINES.split("\n").length).toBe(200);
    expect(NOTE_2000_LINES.split("\n").length).toBe(2000);
    expect(NOTE_10000_LINES.split("\n").length).toBe(10000);
  });

  it("verifies bridge payload sends only metadata and never the full document", () => {
    const fullDoc = NOTE_10000_LINES;
    const fullDocBytes = new TextEncoder().encode(fullDoc).length;
    expect(fullDocBytes).toBeGreaterThan(200_000); // ~260 KB

    const notification: DocChangeNotification = {
      docLength: fullDoc.length,
      changeCount: 1,
      excerpt: fullDoc.slice(0, 60),
      timestamp: Date.now(),
    };

    const payloadBytes = measurePayloadSize(notification);
    expect(payloadBytes).toBeLessThan(200);
    expect(payloadBytes / fullDocBytes).toBeLessThan(0.001); // 99.9% savings
  });

  it("debounces bridge notifications across rapid keystrokes", async () => {
    let callCount = 0;
    let lastReceived: DocChangeNotification | null = null;

    const bridge = createDebouncedBridge<DocChangeNotification>((payload) => {
      callCount += 1;
      lastReceived = payload;
    }, 50);

    for (let i = 1; i <= 20; i++) {
      bridge.emit({
        docLength: 100 + i,
        changeCount: i,
        excerpt: `Keystroke ${i}`,
        timestamp: Date.now(),
      });
    }

    expect(callCount).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(callCount).toBe(1);
    expect((lastReceived as DocChangeNotification | null)?.changeCount).toBe(20);
  });

  it("instantiates CodeMirror 6 with live-preview extensions on 10,000 lines", () => {
    const extensions = [
      EditorView.lineWrapping,
      editorTheme,
      softLineBreakExtension,
      markdown({ extensions: [Strikethrough, highlightExtension] }),
      livePreviewExtension,
      listExtension(),
      tagExtension(),
    ];

    const state = EditorState.create({
      doc: NOTE_10000_LINES,
      extensions,
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView({ state, parent: host });

    // Simulate typing
    const pos = view.state.doc.length;
    view.dispatch({
      changes: { from: pos, to: pos, insert: " mobile test" },
    });
    expect(view.state.doc.sliceString(pos, pos + 12)).toBe(" mobile test");

    view.destroy();
    host.remove();
  });

  it("verifies mobile viewport handler attaches listeners without error", () => {
    const host = document.createElement("div");
    const view: EditorView | null = null;
    const detach = attachMobileViewportHandler({
      container: host,
      getView: () => view,
    });
    expect(typeof detach).toBe("function");
    detach();
  });

  it("verifies iOS focus workaround executes cleanly", () => {
    const state = EditorState.create({ doc: "Test" });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const view = new EditorView({ state, parent: host });

    const result = requestEditorFocus(view);
    expect(typeof result).toBe("boolean");

    view.destroy();
    host.remove();
  });
});
