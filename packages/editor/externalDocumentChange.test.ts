import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { history, undo } from "@codemirror/commands";

import {
  externalChangeAnnotations,
  minimalDocumentChange,
} from "./externalDocumentChange";

describe("externalDocumentChange", () => {
  it("replaces only the changed middle range", () => {
    expect(
      minimalDocumentChange("before OLD after", "before NEW after"),
    ).toEqual({
      from: 7,
      to: 10,
      insert: "NEW",
    });
  });

  it("does not add an external reload to undo history", () => {
    const state = EditorState.create({ doc: "first", extensions: [history()] });
    const next = state.update({
      changes: minimalDocumentChange("first", "second"),
      annotations: externalChangeAnnotations,
    }).state;
    let result = next;
    undo({
      state: next,
      dispatch: (transaction) => {
        result = transaction.state;
      },
    });
    expect(result.doc.toString()).toBe("second");
  });
});
