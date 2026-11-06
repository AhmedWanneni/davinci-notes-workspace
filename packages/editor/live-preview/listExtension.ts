import { Extension, Prec, Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { listTheme } from "./listTheme";
import { listIndentKeymap } from "./listKeymap";
import { keymap } from "@codemirror/view";

const LIST_ITEM_PATTERN =
  /^(\s*)([-*+]|\d+[.)]|[a-zA-Z][.)]|[ivxIVX]+[.)])([ \t]+)(?:\[([^\]\n])\][ \t]*)?/gm;
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

  toDOM(view: EditorView): HTMLElement {
    const checkbox = document.createElement("input");
    checkbox.className = "cm-task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = this.completed;
    checkbox.disabled = this.readOnly;
    checkbox.dataset.markerFrom = String(this.markerFrom);
    checkbox.setAttribute("aria-label", "Toggle task");
    checkbox.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    checkbox.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleTaskByMarkerFrom(this.markerFrom, view);
    });
    return checkbox;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class TaskNoteActionWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "cm-task-note-icon";
    span.title = "Task details / note";
    span.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1z"/>
        <polyline points="9 1 9 5 13 5"/>
        <line x1="6" y1="8" x2="10" y2="8"/>
        <line x1="6" y1="11" x2="10" y2="11"/>
      </svg>
    `;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

export interface ListExtensionOptions {
  isReadOnly?: boolean;
}

export { listIndentKeymap } from "./listKeymap";

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
      const ordered = /^[0-9a-zA-ZivxIVX]+[.)]$/.test(marker);

      const spaces = match[1].replace(/\t/g, "  ").length;
      const level = Math.min(6, Math.floor(spaces / 2));
      decorations.push(listLineDecos[level]!.range(line.from));

      const markerFrom = line.from + indentation;
      if (indentation > 0) {
        decorations.push(indentSpaceDeco.range(line.from, markerFrom));
      }

      if (activeLine && !ordered && taskMarker === undefined) continue;
      const markerTo =
        markerFrom +
        marker.length +
        (taskMarker === undefined ? match[3].length : 0);
      decorations.push(
        Decoration.replace({
          widget: new ListMarkerWidget(ordered, marker),
        }).range(markerFrom, markerTo),
      );

      if (taskMarker === undefined) continue;

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
      decorations.push(
        Decoration.widget({
          widget: new TaskNoteActionWidget(),
          side: 1,
        }).range(line.to),
      );
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

function toggleTaskByMarkerFrom(markerFrom: number, view: EditorView): boolean {
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

function toggleTask(event: MouseEvent, view: EditorView): boolean {
  const checkbox = event.target;
  if (
    !(checkbox instanceof HTMLInputElement) ||
    !checkbox.classList.contains("cm-task-checkbox")
  ) {
    return false;
  }

  const markerFrom = Number(checkbox.dataset.markerFrom);
  return toggleTaskByMarkerFrom(markerFrom, view);
}

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
    Prec.high(keymap.of(listIndentKeymap)),
  ];
}
