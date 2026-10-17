import type { EditorView } from "@codemirror/view";
import { undo, redo, indentMore, indentLess } from "@codemirror/commands";
import type { ToolbarActionType } from "../src/bridgeProtocol";

/**
 * Executes a formatting toolbar action on the active CodeMirror EditorView.
 */
export function executeToolbarAction(
  view: EditorView,
  action: ToolbarActionType,
): void {
  const { from, to } = view.state.selection.main;

  switch (action) {
    case "wikilink": {
      const text = view.state.sliceDoc(from, to);
      const insert = `[[${text}]]`;
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + (text ? insert.length : 2) },
        scrollIntoView: true,
      });
      break;
    }
    case "link": {
      const text = view.state.sliceDoc(from, to) || "text";
      const insert = `[${text}](url)`;
      view.dispatch({
        changes: { from, to, insert },
        selection: {
          anchor: from + insert.length - 4,
          head: from + insert.length - 1,
        },
        scrollIntoView: true,
      });
      break;
    }
    case "tag": {
      view.dispatch({
        changes: { from, to, insert: "#" },
        selection: { anchor: from + 1 },
        scrollIntoView: true,
      });
      break;
    }
    case "checkbox": {
      const line = view.state.doc.lineAt(from);
      const insert = "- [ ] ";
      view.dispatch({
        changes: { from: line.from, to: line.from, insert },
        selection: { anchor: from + insert.length },
        scrollIntoView: true,
      });
      break;
    }
    case "indent": {
      indentMore(view);
      break;
    }
    case "outdent": {
      indentLess(view);
      break;
    }
    case "undo": {
      undo(view);
      break;
    }
    case "redo": {
      redo(view);
      break;
    }
    case "camera":
    case "photo":
    case "audio":
      // Handled by native container layer
      break;
  }
}
