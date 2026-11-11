// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import { getCM, Vim } from "@replit/codemirror-vim";
import { Editor } from "./Editor";

if (typeof Range.prototype.getClientRects !== "function") {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof Range.prototype.getBoundingClientRect !== "function") {
  Range.prototype.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

describe("Editor component — rendering, frontmatter, todo checkboxes, and Vim mode", () => {
  it("renders note content when value loads asynchronously after mount and initializes Vim mode", async () => {
    let activeView: EditorView | null = null;
    const vimModes: (string | null)[] = [];

    function Harness() {
      const [val, setVal] = useState("");
      return (
        <div>
          <button
            type="button"
            id="load-note"
            onClick={() =>
              setVal(
                "---\ntitle: English\ntags:\n  - study\n---\n# English\n- [ ] Practice vocabulary\n- [x] Read chapter 1",
              )
            }
          >
            Load
          </button>
          <Editor
            value={val}
            onChange={setVal}
            notePaths={["Learning/English.md"]}
            sourcePath="Learning/English.md"
            onLinkClick={() => {}}
            useVimMode={true}
            onVimModeChange={(m) => vimModes.push(m)}
            onViewReady={(v) => {
              activeView = v;
            }}
          />
        </div>
      );
    }

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<Harness />);
    });

    // Wait for dynamic loadVimExtension()
    for (let i = 0; i < 20; i++) {
      if (activeView && getCM(activeView)?.state?.vim) break;
      await act(async () => {
        await new Promise((r) => setTimeout(r, 15));
      });
    }

    expect(activeView).not.toBeNull();
    expect(getCM(activeView!)?.state?.vim).toBeDefined();
    expect(vimModes).toContain("NORMAL");

    // Simulate async note load from disk
    await act(async () => {
      host.querySelector<HTMLButtonElement>("#load-note")?.click();
    });

    const contentEl = host.querySelector(".cm-content");
    expect(contentEl?.textContent).toContain("English");
    expect(contentEl?.textContent).toContain("Practice vocabulary");

    // Frontmatter YAML lines should be hidden in live preview
    expect(contentEl?.textContent).not.toContain("title: English");

    // Cursor should be placed in the visible body, not trapped inside hidden frontmatter
    const headLine = activeView!.state.doc.lineAt(
      activeView!.state.selection.main.head,
    ).number;
    expect(headLine).toBeGreaterThanOrEqual(6);

    // Vim motions and mode transitions work on the loaded note
    const cm = getCM(activeView!)!;
    expect(cm.state.vim.insertMode).toBe(false);
    Vim.handleKey(cm, "i");
    expect(cm.state.vim.insertMode).toBe(true);
    Vim.exitInsertMode(cm);
    expect(cm.state.vim.insertMode).toBe(false);

    // Clicking the unchecked todo checkbox toggles it to [x] without revealing raw `- [ ]` code
    const checkboxes = host.querySelectorAll<HTMLInputElement>(
      "input.cm-task-checkbox",
    );
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0]?.checked).toBe(false);

    await act(async () => {
      checkboxes[0]?.click();
    });

    expect(activeView!.state.doc.toString()).toContain(
      "- [x] Practice vocabulary",
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
