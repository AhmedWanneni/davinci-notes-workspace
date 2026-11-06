import { EditorState, Range, StateField, type Text } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";

class HiddenFrontmatter extends WidgetType {
  toDOM(): HTMLElement {
    const hidden = document.createElement("span");
    hidden.className = "cm-frontmatter-hidden";
    hidden.setAttribute("aria-hidden", "true");
    hidden.style.display = "none";
    return hidden;
  }
}

export function findFrontmatterEndLineInDoc(doc: Text): number | null {
  if (doc.lines < 2) return null;
  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== "---") return null;

  for (let lineNumber = 2; lineNumber <= doc.lines; lineNumber += 1) {
    const line = doc.line(lineNumber);
    const trimmed = line.text.trim();
    if (trimmed === "---" || trimmed === "...") {
      return lineNumber;
    }
    if (/^#{1,6}\s+/.test(trimmed)) {
      return null;
    }
    if (
      trimmed.length > 0 &&
      !trimmed.startsWith("#") &&
      !/^([A-Za-z0-9_.-]+)\s*:/.test(trimmed) &&
      !/^\s+/.test(line.text) &&
      !trimmed.startsWith("- ")
    ) {
      return null;
    }
  }
  return null;
}

function frontmatterDecoration(state: EditorState): DecorationSet {
  const endLineNumber = findFrontmatterEndLineInDoc(state.doc);
  if (endLineNumber === null) return Decoration.none;

  const ranges: Range<Decoration>[] = [];
  for (let lineNumber = 1; lineNumber <= endLineNumber; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    ranges.push(
      Decoration.line({
        class: "cm-frontmatter-hidden-line",
        attributes: { "aria-hidden": "true" },
      }).range(line.from),
    );
    if (line.from < line.to) {
      ranges.push(
        Decoration.replace({
          widget: lineNumber === 1 ? new HiddenFrontmatter() : undefined,
        }).range(line.from, line.to),
      );
    } else if (lineNumber === 1) {
      ranges.push(
        Decoration.widget({
          widget: new HiddenFrontmatter(),
        }).range(line.from),
      );
    }
  }
  return Decoration.set(ranges, true);
}

const frontmatterHideTheme = EditorView.baseTheme({
  ".cm-line.cm-frontmatter-hidden-line": {
    display: "none !important",
    height: "0 !important",
    minHeight: "0 !important",
    padding: "0 !important",
    margin: "0 !important",
    overflow: "hidden !important",
  },
});

export function frontmatterHideExtension() {
  const field = StateField.define<DecorationSet>({
    create: (state) => frontmatterDecoration(state),
    update: (decorations, transaction) =>
      transaction.docChanged
        ? frontmatterDecoration(transaction.state)
        : decorations.map(transaction.changes),
    provide: (f) => EditorView.decorations.from(f),
  });
  const skipHiddenFrontmatterSelection = EditorState.transactionFilter.of((tr) => {
    if (!tr.selection && !tr.docChanged) return tr;
    const endLineNumber = findFrontmatterEndLineInDoc(tr.newDoc);
    if (endLineNumber === null) return tr;
    const endLine = tr.newDoc.line(endLineNumber);
    const bodyStart = Math.min(tr.newDoc.length, endLine.to + 1);
    const main = tr.newSelection.main;
    if (main.empty && main.head <= endLine.to && bodyStart <= tr.newDoc.length) {
      return [tr, { selection: { anchor: bodyStart }, sequential: true }];
    }
    return tr;
  });
  return [field, frontmatterHideTheme, skipHiddenFrontmatterSelection];
}
