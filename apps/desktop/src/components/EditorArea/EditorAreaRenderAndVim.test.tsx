// @vitest-environment jsdom
import React, { useMemo, useState } from "react";
import { describe, expect, it } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { parseFrontmatter } from "@app/indexer";
import { Editor, type EditorView } from "@app/editor";
import {
  PropertiesBlock,
  upsertNoteProperty,
  removeNoteProperty,
} from "../PropertiesBlock";
import { stripNoteMetadata } from "./stripNoteMetadata";

if (typeof Range.prototype.getClientRects !== "function") {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}
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

describe("EditorArea properties + Editor + Vim + Todo checkbox integration", () => {
  it("renders scrollable properties at top, adds/updates properties, toggles todo checkbox, and runs Vim mode", async () => {
    let activeView: EditorView | null = null;
    const vimModes: (string | null)[] = [];

    function EditorAreaBodyHarness() {
      const [content, setContent] = useState(
        "# English\n- [ ] Learn phrasal verbs\n- [x] Review grammar",
      );
      const cleanedContent = useMemo(() => stripNoteMetadata(content), [content]);
      const { frontmatter } = useMemo(
        () => parseFrontmatter(cleanedContent),
        [cleanedContent],
      );

      return (
        <div className="editor-area__body editor-area__body--readable-width">
          <div className="editor-area__properties-wrap">
            <PropertiesBlock
              frontmatter={frontmatter}
              onAddProperty={(key, val) =>
                setContent((prev) => upsertNoteProperty(prev, key, val))
              }
              onUpdateProperty={(key, val) =>
                setContent((prev) => upsertNoteProperty(prev, key, val))
              }
              onRemoveProperty={(key) =>
                setContent((prev) => removeNoteProperty(prev, key))
              }
            />
          </div>
          <Editor
            value={cleanedContent}
            onChange={setContent}
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

    const { container, getByText, getByLabelText } = render(
      <EditorAreaBodyHarness />,
    );

    // 1. Verify note content is rendered in .cm-content
    await waitFor(() => {
      expect(container.querySelector(".cm-content")?.textContent).toContain(
        "English",
      );
      expect(container.querySelector(".cm-content")?.textContent).toContain(
        "Learn phrasal verbs",
      );
      expect(activeView).not.toBeNull();
      expect(container.querySelector(".cm-vimMode")).not.toBeNull();
      expect(vimModes).toContain("NORMAL");
    });

    // 2. Verify PropertiesBlock is inside the scrollable .editor-area__body above Editor
    const bodyEl = container.querySelector(".editor-area__body")!;
    expect(bodyEl.firstElementChild?.classList.contains("editor-area__properties-wrap")).toBe(true);
    expect(bodyEl.lastElementChild?.classList.contains("editor-container")).toBe(true);

    // 3. Click "+ Add property" and add a property
    fireEvent.click(getByText("Add property"));
    fireEvent.change(getByLabelText("Property name"), {
      target: { value: "status" },
    });
    fireEvent.change(getByLabelText("Property value"), {
      target: { value: "active" },
    });
    fireEvent.click(getByLabelText("Save property"));

    // Verify property row appears in PropertiesBlock while note body remains visible in Editor
    await waitFor(() => {
      expect(getByText("status")).toBeTruthy();
      expect(getByText("active")).toBeTruthy();
      expect(container.querySelector(".cm-content")?.textContent).toContain(
        "Learn phrasal verbs",
      );
    });
    // Frontmatter raw YAML is hidden inside live preview
    expect(container.querySelector(".cm-content")?.textContent).not.toContain(
      "status: active",
    );

    // 4. Click todo checkbox and verify it toggles without showing raw `- [ ]` code
    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      "input.cm-task-checkbox",
    );
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0]?.checked).toBe(false);
    fireEvent.click(checkboxes[0]!);

    await waitFor(() => {
      expect(activeView!.state.doc.toString()).toContain(
        "- [x] Learn phrasal verbs",
      );
    });

    // 5. Verify Vim mode remain active after adding property and toggling checkbox
    expect(container.querySelector(".cm-vimMode")).not.toBeNull();
    expect(vimModes.at(-1)).toBe("NORMAL");
  });
});
