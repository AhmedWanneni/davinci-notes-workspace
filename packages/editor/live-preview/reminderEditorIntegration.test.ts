// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { history, undo, redo, isolateHistory } from "@codemirror/commands";
import { reminderExtension } from "./reminderExtension";
import { reminderTheme } from "../theme/reminderTheme";

describe("Reminder Editor Integration: Insert, Edit, Remove, Undo/Redo", () => {
  it("inserts, edits, and removes a reminder while preserving document integrity and supporting undo/redo", () => {
    let currentDiskContent = "- [ ] Call the doctor";

    const state = EditorState.create({
      doc: currentDiskContent,
      extensions: [
        history(),
        markdown(),
        reminderTheme,
        reminderExtension(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            currentDiskContent = update.state.doc.toString();
          }
        }),
      ],
    });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({ state, parent: container });

    // 1. Insert reminder at end of task: " (@2026-10-15 09:00)"
    const insertPos = view.state.doc.length;
    view.dispatch({
      changes: { from: insertPos, insert: " (@2026-10-15 09:00)" },
      annotations: [isolateHistory.of("before")],
    });

    expect(view.state.doc.toString()).toBe(
      "- [ ] Call the doctor (@2026-10-15 09:00)",
    );
    expect(currentDiskContent).toBe(
      "- [ ] Call the doctor (@2026-10-15 09:00)",
    );

    // 2. Edit reminder in place: change to "(@2026-10-20 14:00)"
    const tokenStart = view.state.doc.toString().indexOf("(@");
    const tokenEnd = view.state.doc.length;
    view.dispatch({
      changes: {
        from: tokenStart,
        to: tokenEnd,
        insert: "(@2026-10-20 14:00)",
      },
      annotations: [isolateHistory.of("before")],
    });

    expect(view.state.doc.toString()).toBe(
      "- [ ] Call the doctor (@2026-10-20 14:00)",
    );
    expect(currentDiskContent).toBe(
      "- [ ] Call the doctor (@2026-10-20 14:00)",
    );

    // 3. Test Undo of edit: restores previous reminder
    undo(view);
    expect(view.state.doc.toString()).toBe(
      "- [ ] Call the doctor (@2026-10-15 09:00)",
    );
    expect(currentDiskContent).toBe(
      "- [ ] Call the doctor (@2026-10-15 09:00)",
    );

    // 4. Test Redo of edit: restores modified reminder
    redo(view);
    expect(view.state.doc.toString()).toBe(
      "- [ ] Call the doctor (@2026-10-20 14:00)",
    );
    expect(currentDiskContent).toBe(
      "- [ ] Call the doctor (@2026-10-20 14:00)",
    );

    // 5. Remove reminder: delete the token
    const removeStart = view.state.doc.toString().indexOf(" (@");
    view.dispatch({
      changes: {
        from: removeStart,
        to: view.state.doc.length,
        insert: "",
      },
      annotations: [isolateHistory.of("before")],
    });

    expect(view.state.doc.toString()).toBe("- [ ] Call the doctor");
    expect(currentDiskContent).toBe("- [ ] Call the doctor");

    // 6. Test Undo of remove: restores reminder
    undo(view);
    expect(view.state.doc.toString()).toBe(
      "- [ ] Call the doctor (@2026-10-20 14:00)",
    );
    expect(currentDiskContent).toBe(
      "- [ ] Call the doctor (@2026-10-20 14:00)",
    );
  });
});
