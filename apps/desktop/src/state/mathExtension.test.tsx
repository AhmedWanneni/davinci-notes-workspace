// @vitest-environment jsdom
import { editorTheme, mathExtension, mathTheme } from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";

function createMathEditor(doc: string, readOnly = false) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        editorTheme,
        mathTheme,
        markdown(),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        mathExtension({ isReadOnly: readOnly }),
      ],
    }),
    parent: container,
  });
  return { container, view, destroy: () => view.destroy() };
}

const waitForMath = () => new Promise((resolve) => setTimeout(resolve, 250));

describe("Math extension", () => {
  it("renders determinant block math and inline exponential math", async () => {
    const { container, destroy } = createMathEditor(
      [
        "The identity $e^{2i\\pi} = 1$ is useful.",
        "",
        "$$",
        "\\begin{vmatrix}a & b\\\\ c & d\\end{vmatrix}=ad-bc",
        "$$",
      ].join("\n"),
      true,
    );
    await waitForMath();
    expect(container.querySelector(".cm-math-inline .katex")).not.toBeNull();
    expect(
      container.querySelector(".cm-math-block .katex-display"),
    ).not.toBeNull();
    destroy();
  });

  it("reveals block source while editing and renders after leaving it", async () => {
    const source = "$$\nx^2 + y^2\n$$\n\nText";
    const { container, view, destroy } = createMathEditor(source);
    view.dispatch({ selection: EditorSelection.cursor(source.indexOf("x^2")) });
    expect(container.querySelector(".cm-math-block")).toBeNull();
    view.dispatch({ selection: EditorSelection.cursor(source.length) });
    expect(container.querySelector(".cm-math-block")).not.toBeNull();
    await waitForMath();
    expect(container.querySelector(".cm-math-block .katex")).not.toBeNull();
    destroy();
  });

  it("shows a graceful error for invalid LaTeX", async () => {
    const { container, destroy } = createMathEditor(
      "$\\notARealCommand$",
      true,
    );
    await waitForMath();
    expect(container.querySelector(".cm-math-error")).not.toBeNull();
    destroy();
  });
});
