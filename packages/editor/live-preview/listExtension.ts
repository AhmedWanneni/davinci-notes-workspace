import { Extension, Range } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";

const LIST_ITEM_PATTERN =
  /^(\s*)([-*+]|\d+[.)])([ \t]+)(?:\[([^\]\n])\][ \t]*)?/gm;
const completedTaskDeco = Decoration.mark({ class: "cm-task-completed" });
const indentSpaceDeco = Decoration.mark({ class: "cm-list-indent-space" });

const listLineDecos: Decoration[] = Array.from({ length: 7 }, (_, i) =>
  Decoration.line({ class: `cm-list-line cm-list-level-${i}` }),
);

class ListMarkerWidget extends WidgetType {
  constructor(
    readonly ordered: boolean,
    readonly text: string,
  ) {
    super();
  }

  eq(other: ListMarkerWidget): boolean {
    return this.ordered === other.ordered && this.text === other.text;
  }

  toDOM(): HTMLElement {
    const marker = document.createElement("span");
    marker.className = this.ordered ? "cm-list-ordered" : "cm-list-bullet";
    marker.textContent = this.ordered ? this.text : "•";
    return marker;
  }
}

class TaskCheckboxWidget extends WidgetType {
  constructor(
    readonly markerFrom: number,
    readonly completed: boolean,
    readonly readOnly: boolean,
  ) {
    super();
  }

  eq(other: TaskCheckboxWidget): boolean {
    return (
      this.markerFrom === other.markerFrom &&
      this.completed === other.completed &&
      this.readOnly === other.readOnly
    );
  }

  toDOM(): HTMLElement {
    const checkbox = document.createElement("input");
    checkbox.className = "cm-task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = this.completed;
    checkbox.disabled = this.readOnly;
    checkbox.dataset.markerFrom = String(this.markerFrom);
    checkbox.setAttribute("aria-label", "Toggle task");
    return checkbox;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

export interface ListExtensionOptions {
  isReadOnly?: boolean;
}

/** Native CodeMirror Tab/Shift+Tab bindings for list indentation. */
export const listIndentKeymap = [indentWithTab];

function isActiveLine(view: EditorView, lineNumber: number, readOnly: boolean) {
  return (
    !readOnly &&
    view.state.doc.lineAt(view.state.selection.main.head).number === lineNumber
  );
}

function getListDecorations(
  view: EditorView,
  options: ListExtensionOptions,
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const readOnly = options.isReadOnly || !view.state.facet(EditorView.editable);

  for (const { from, to } of view.visibleRanges) {
    const firstLine = view.state.doc.lineAt(from).number;
    const lastLine = view.state.doc.lineAt(to).number;

    for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber++) {
      const line = view.state.doc.line(lineNumber);
      const match = LIST_ITEM_PATTERN.exec(line.text);
      LIST_ITEM_PATTERN.lastIndex = 0;
      if (!match) continue;

      const indentation = match[1].length;
      const marker = match[2];
      const taskMarker = match[4];
      const activeLine = isActiveLine(view, lineNumber, readOnly);
      const ordered = /^\d/.test(marker);

      const spaces = match[1].replace(/\t/g, "  ").length;
      const level = Math.min(6, Math.floor(spaces / 2));
      decorations.push(listLineDecos[level]!.range(line.from));

      const markerFrom = line.from + indentation;
      if (!activeLine && indentation > 0) {
        decorations.push(indentSpaceDeco.range(line.from, markerFrom));
      }

      if (activeLine && !ordered) continue;
      const markerTo =
        markerFrom +
        marker.length +
        (taskMarker === undefined ? match[3].length : 0);
      decorations.push(
        Decoration.replace({
          widget: new ListMarkerWidget(ordered, marker),
        }).range(markerFrom, markerTo),
      );

      if (taskMarker === undefined || activeLine) continue;

      const taskFrom = markerTo + match[3].length;
      const completed = taskMarker !== " ";
      decorations.push(
        Decoration.replace({
          widget: new TaskCheckboxWidget(taskFrom, completed, readOnly),
        }).range(taskFrom, taskFrom + 3),
      );
      if (completed && taskFrom + 3 < line.to) {
        decorations.push(completedTaskDeco.range(taskFrom + 3, line.to));
      }
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

function toggleTask(event: MouseEvent, view: EditorView): boolean {
  const checkbox = event.target;
  if (
    !(checkbox instanceof HTMLInputElement) ||
    !checkbox.classList.contains("cm-task-checkbox")
  ) {
    return false;
  }

  const markerFrom = Number(checkbox.dataset.markerFrom);
  const currentMarker = view.state.doc.sliceString(markerFrom, markerFrom + 3);
  if (!/^\[[^\]\n]\]$/.test(currentMarker)) return true;

  view.dispatch({
    changes: {
      from: markerFrom + 1,
      to: markerFrom + 2,
      insert: currentMarker[1] === " " ? "x" : " ",
    },
    userEvent: "input.toggleTask",
  });
  return true;
}

const listTheme = EditorView.theme({
  ".cm-line.cm-list-line": {
    paddingTop: "var(--editor-obsidian-spacing-list)",
    paddingBottom: "var(--editor-obsidian-spacing-list)",
    textIndent: "calc(-1 * var(--editor-list-indent))",
  },
  ".cm-line.cm-list-level-0": { paddingLeft: "var(--editor-list-indent)" },
  ".cm-line.cm-list-level-1": {
    paddingLeft: "calc(2 * var(--editor-list-indent))",
  },
  ".cm-line.cm-list-level-2": {
    paddingLeft: "calc(3 * var(--editor-list-indent))",
  },
  ".cm-line.cm-list-level-3": {
    paddingLeft: "calc(4 * var(--editor-list-indent))",
  },
  ".cm-line.cm-list-level-4": {
    paddingLeft: "calc(5 * var(--editor-list-indent))",
  },
  ".cm-line.cm-list-level-5": {
    paddingLeft: "calc(6 * var(--editor-list-indent))",
  },
  ".cm-line.cm-list-level-6": {
    paddingLeft: "calc(7 * var(--editor-list-indent))",
  },
  ".cm-list-indent-space": {
    display: "none !important",
  },
  ".cm-list-bullet, .cm-list-ordered": {
    display: "inline-block",
    width: "var(--editor-list-indent)",
    minWidth: "var(--editor-list-indent)",
    textAlign: "left",
    textIndent: "0",
    boxSizing: "border-box",
  },
  ".cm-list-ordered": {
    fontVariantNumeric: "tabular-nums",
  },
  ".cm-task-checkbox": {
    margin: "0 var(--space-2) 0 0",
    verticalAlign: "middle",
  },
});

/** Renders Markdown list markers and task checkboxes with hanging indents in live preview. */
export function listExtension(options: ListExtensionOptions = {}): Extension {
  return [
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = getListDecorations(view, options);
        }

        update(update: ViewUpdate) {
          if (
            update.docChanged ||
            update.viewportChanged ||
            update.selectionSet
          ) {
            this.decorations = getListDecorations(update.view, options);
          }
        }
      },
      {
        decorations: (value) => value.decorations,
        eventHandlers: { click: toggleTask },
      },
    ),
    listTheme,
  ];
}
