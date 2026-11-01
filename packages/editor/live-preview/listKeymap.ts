import { EditorView, type KeyBinding } from "@codemirror/view";
import { indentMore, indentLess } from "@codemirror/commands";

const LIST_LINE_REGEX =
  /^(\s*)([-*+]|\d+[.)]|[a-zA-Z][.)]|[ivxIVX]+[.)])([ \t]+)(?:\[([ xX])\][ \t]*)?(.*)$/;

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

function getNextMarker(marker: string): string {
  const numMatch = marker.match(/^(\d+)([.)])$/);
  if (numMatch) return `${parseInt(numMatch[1], 10) + 1}${numMatch[2]}`;

  const alphaMatch = marker.match(/^([a-zA-Z])([.)])$/);
  if (alphaMatch) {
    const nextChar = String.fromCharCode(alphaMatch[1].charCodeAt(0) + 1);
    return `${nextChar}${alphaMatch[2]}`;
  }

  const romanMatch = marker.match(/^([ivxIVX]+)([.)])$/);
  if (romanMatch) {
    const isUpper = romanMatch[1] === romanMatch[1].toUpperCase();
    const idx = ROMAN.indexOf(romanMatch[1].toLowerCase());
    const next = idx >= 0 && idx < ROMAN.length - 1 ? ROMAN[idx + 1] : "i";
    return `${isUpper ? next.toUpperCase() : next}${romanMatch[2]}`;
  }
  return marker;
}

function findParentPrefix(
  state: EditorView["state"],
  startLine: number,
  indentLen: number,
): string {
  for (let l = startLine - 1; l >= 1; l--) {
    const prevMatch = LIST_LINE_REGEX.exec(state.doc.line(l).text);
    if (prevMatch && prevMatch[1].length < indentLen) {
      return `${getNextMarker(prevMatch[2])} `;
    }
  }
  return "";
}

export function handleListEnter(view: EditorView): boolean {
  const { state } = view;
  if (!state.facet(EditorView.editable)) return false;

  const sel = state.selection.main;
  const line = state.doc.lineAt(sel.head);
  const match = LIST_LINE_REGEX.exec(line.text);
  if (!match) return false;

  const [_, indent, marker, space, taskState, content] = match;
  const isTask = taskState !== undefined;

  // If user pressed Enter on an empty list item:
  if (!content.trim()) {
    // If it's an indented sublist item (indent.length > 0):
    // Complete the sublist and outdent back to parent list level
    if (indent.length > 0) {
      const outdentedPrefix = findParentPrefix(
        state,
        line.number,
        indent.length,
      );
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: outdentedPrefix },
        selection: { anchor: line.from + outdentedPrefix.length },
        userEvent: "input.completeSublist",
      });
      return true;
    }

    // Top-level empty list item: clear to empty line
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
      userEvent: "input.completeList",
    });
    return true;
  }

  // Calculate next line's prefix - stays at the current indent level
  let nextPrefix: string;
  if (isTask) {
    nextPrefix = `${indent}${marker}${space}[ ] `;
  } else {
    nextPrefix = `${indent}${getNextMarker(marker)}${space}`;
  }

  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: `\n${nextPrefix}` },
    selection: { anchor: sel.from + 1 + nextPrefix.length },
    userEvent: "input.continueList",
  });
  return true;
}

export function handleListTab(view: EditorView): boolean {
  const { state } = view;
  if (!state.facet(EditorView.editable)) return false;

  const sel = state.selection.main;
  if (!sel.empty) return false;

  const line = state.doc.lineAt(sel.head);
  const match = LIST_LINE_REGEX.exec(line.text);
  if (!match) return false;

  const [_, indent, marker, space, taskState, content] = match;
  const isNumeric = /^\d+[.)]$/.test(marker);
  const isAlpha = /^[a-zA-Z][.)]$/.test(marker);
  const delim = marker.slice(-1);

  let newMarker = marker;
  if (isNumeric) {
    // Restart sub-numeric list at 1.
    newMarker = `1${delim}`;
  } else if (isAlpha) {
    newMarker = marker === marker.toUpperCase() ? `A${delim}` : `a${delim}`;
  }

  const taskPrefix = taskState !== undefined ? `[${taskState}] ` : "";
  const newLineText = `${indent}   ${newMarker}${space}${taskPrefix}${content}`;

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newLineText },
    selection: {
      anchor: Math.min(line.from + newLineText.length, sel.head + 3),
    },
    userEvent: "input.indentList",
  });
  return true;
}

export function handleListShiftTab(view: EditorView): boolean {
  const { state } = view;
  if (!state.facet(EditorView.editable)) return false;

  const sel = state.selection.main;
  if (!sel.empty) return false;

  const line = state.doc.lineAt(sel.head);
  const match = LIST_LINE_REGEX.exec(line.text);
  if (!match || !match[1].length) return false;

  const unindentLen = Math.min(3, match[1].length);
  view.dispatch({
    changes: { from: line.from, to: line.from + unindentLen, insert: "" },
    selection: { anchor: Math.max(line.from, sel.head - unindentLen) },
    userEvent: "input.unindentList",
  });
  return true;
}

export function handleListBackspace(view: EditorView): boolean {
  const { state } = view;
  if (!state.facet(EditorView.editable)) return false;

  const sel = state.selection.main;
  if (!sel.empty) return false;

  const line = state.doc.lineAt(sel.head);
  const match = LIST_LINE_REGEX.exec(line.text);
  if (!match) return false;

  const [_, indent, , , , content] = match;
  if (!content.trim()) {
    const prefixLen = line.text.length - content.length;
    if (sel.head >= line.from + prefixLen) {
      if (indent.length > 0) {
        const outdentedPrefix = findParentPrefix(
          state,
          line.number,
          indent.length,
        );
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: outdentedPrefix },
          selection: { anchor: line.from + outdentedPrefix.length },
          userEvent: "input.outdentList",
        });
        return true;
      }
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: "" },
        selection: { anchor: line.from },
        userEvent: "input.clearList",
      });
      return true;
    }
  }
  return false;
}

export function handleListSpace(view: EditorView): boolean {
  const { state } = view;
  if (!state.facet(EditorView.editable)) return false;

  const sel = state.selection.main;
  if (!sel.empty) return false;

  const line = state.doc.lineAt(sel.head);
  const textBefore = line.text.slice(0, sel.head - line.from);

  // If user typed "-" or "*" or "+" at beginning of line
  const bulletMatch = /^(\s*)([-*+])$/.exec(textBefore);
  if (bulletMatch) {
    view.dispatch({
      changes: { from: sel.head, insert: " " },
      selection: { anchor: sel.head + 1 },
      userEvent: "input.createList",
    });
    return true;
  }

  // If user typed "1." or "1)" at beginning of line
  const numMatch = /^(\s*)(\d+[.)])$/.exec(textBefore);
  if (numMatch) {
    view.dispatch({
      changes: { from: sel.head, insert: " " },
      selection: { anchor: sel.head + 1 },
      userEvent: "input.createList",
    });
    return true;
  }

  return false;
}

export const listIndentKeymap: readonly KeyBinding[] = [
  {
    key: "Tab",
    run: (view) => handleListTab(view) || indentMore(view),
    shift: (view) => handleListShiftTab(view) || indentLess(view),
  },
  {
    key: "Enter",
    run: handleListEnter,
  },
  {
    key: "Backspace",
    run: handleListBackspace,
  },
  {
    key: "Space",
    run: handleListSpace,
  },
];
