// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { history, undo } from "@codemirror/commands";
import { EditorSelection, EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import {
  autocompletion,
  closeCompletion,
  CompletionContext,
  completionStatus,
} from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { mathExtension } from "../blocks/math";
import { isSlashMenuTrigger, slashMenuSource } from "./SlashMenu";

function createContext(
  doc: string,
  cursorOffset: number,
  options: {
    composing?: boolean;
    enabled?: boolean;
    vimMode?: string | null;
  } = {},
) {
  const state = EditorState.create({
    doc,
    extensions: [markdown(), mathExtension()],
  });
  const context = new CompletionContext(state, cursorOffset, true);
  if (options.composing) {
    (context as unknown as { view: EditorView }).view = {
      composing: true,
    } as unknown as EditorView;
  }
  return { context, state };
}

describe("isSlashMenuTrigger unit checks", () => {
  it("allows a line start and whitespace", () => {
    expect(isSlashMenuTrigger("", true)).toBe(true);
    expect(isSlashMenuTrigger("text ", true)).toBe(true);
    expect(isSlashMenuTrigger("\n", true)).toBe(true);
  });

  it("rejects word, path, URL, disabled, and Vim normal contexts", () => {
    expect(isSlashMenuTrigger("and", true)).toBe(false);
    expect(isSlashMenuTrigger("a", true)).toBe(false);
    expect(isSlashMenuTrigger("https:", true)).toBe(false);
    expect(isSlashMenuTrigger("https:/", true)).toBe(false);
    expect(isSlashMenuTrigger("", false)).toBe(false);
    expect(isSlashMenuTrigger("", true, "NORMAL")).toBe(false);
    expect(isSlashMenuTrigger("", true, "VISUAL")).toBe(false);
  });

  it("rejects when IME composition is active", () => {
    expect(
      isSlashMenuTrigger("", true, null, {
        view: { composing: true } as unknown as EditorView,
      }),
    ).toBe(false);
  });
});

describe("slashMenuSource trigger exclusions", () => {
  const trigger = slashMenuSource({ enabled: true });

  it("opens at line start and after a space", async () => {
    const lineStart = createContext("/t", 2);
    const resultStart = await trigger(lineStart.context);
    expect(resultStart).not.toBeNull();
    expect(resultStart?.options.length).toBeGreaterThan(0);

    const afterSpace = createContext("hello /t", 8);
    const resultSpace = await trigger(afterSpace.context);
    expect(resultSpace).not.toBeNull();
    expect(resultSpace?.options.length).toBeGreaterThan(0);
  });

  it("does not open mid-word (and/or and a/b)", async () => {
    const andOr = createContext("and/or", 6);
    expect(await trigger(andOr.context)).toBeNull();

    const slashOnlyMidWord = createContext("and/", 4);
    expect(await trigger(slashOnlyMidWord.context)).toBeNull();

    const ab = createContext("a/b", 3);
    expect(await trigger(ab.context)).toBeNull();
  });

  it("does not open inside https://x or url paths", async () => {
    const urlFirstSlash = createContext("https:/", 7);
    expect(await trigger(urlFirstSlash.context)).toBeNull();

    const urlDoubleSlash = createContext("https://", 8);
    expect(await trigger(urlDoubleSlash.context)).toBeNull();

    const urlWithPath = createContext("https://x/y", 11);
    expect(await trigger(urlWithPath.context)).toBeNull();
  });

  it("does not open inside fenced code blocks", async () => {
    const text = "```ts\n/tab\n```";
    const fenced = createContext(text, 10);
    expect(await trigger(fenced.context)).toBeNull();
  });

  it("does not open inside inline code", async () => {
    const text = "`/tab`";
    const inline = createContext(text, 5);
    expect(await trigger(inline.context)).toBeNull();
  });

  it("does not open inside math blocks and inline math", async () => {
    const blockMath = createContext("$$\n/tab\n$$", 7);
    expect(await trigger(blockMath.context)).toBeNull();

    const inlineMath = createContext("$/tab$", 5);
    expect(await trigger(inlineMath.context)).toBeNull();
  });

  it("does not open inside frontmatter", async () => {
    const frontmatter = createContext("---\ntitle: doc\n/tab\n---\nBody", 20);
    expect(await trigger(frontmatter.context)).toBeNull();
  });

  it("does not open during IME composition", async () => {
    const ime = createContext("/tab", 4, { composing: true });
    expect(await trigger(ime.context)).toBeNull();
  });

  it("does not open when disabled in settings", async () => {
    const disabledTrigger = slashMenuSource({ enabled: false });
    const atLineStart = createContext("/tab", 4);
    expect(await disabledTrigger(atLineStart.context)).toBeNull();
  });
});

describe("slashMenuSource transaction semantics and dismissal", () => {
  it("filters to Table with /tab, applies in one transaction, and restores text on undo", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({
      state: EditorState.create({
        doc: "",
        selection: EditorSelection.cursor(0),
        extensions: [
          history({ newGroupDelay: 0 }),
          autocompletion({ override: [slashMenuSource({ enabled: true })] }),
        ],
      }),
      parent: container,
    });

    view.dispatch({
      changes: { from: 0, insert: "/tab" },
      selection: { anchor: 4 },
    });
    expect(view.state.doc.toString()).toBe("/tab");

    const context = new CompletionContext(view.state, 4, true);
    (context as unknown as { view: EditorView }).view = view;
    const result = await slashMenuSource({ enabled: true })(context);

    expect(result).not.toBeNull();
    const tableOpt = result?.options.find((opt) => opt.label === "Table");
    expect(tableOpt).toBeDefined();

    tableOpt!.apply(
      view,
      tableOpt!,
      result!.from,
      view.state.selection.main.to,
    );

    const docAfter = view.state.doc.toString();
    expect(docAfter).not.toContain("/tab");
    expect(docAfter).toContain("| Header 1 | Header 2 | Header 3 |");

    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("/tab");

    view.destroy();
    container.remove();
  });

  it("leaves '/' as plain text when Escape closes completion", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({
      state: EditorState.create({
        doc: "/",
        selection: EditorSelection.cursor(1),
        extensions: [
          history(),
          autocompletion({ override: [slashMenuSource({ enabled: true })] }),
        ],
      }),
      parent: container,
    });

    closeCompletion(view);
    expect(completionStatus(view.state)).toBe(null);
    expect(view.state.doc.toString()).toBe("/");

    view.destroy();
    container.remove();
  });

  it("leaves '/' as plain text when slash menu setting is off", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({
      state: EditorState.create({
        doc: "/",
        selection: EditorSelection.cursor(1),
        extensions: [
          history(),
          autocompletion({ override: [slashMenuSource({ enabled: false })] }),
        ],
      }),
      parent: container,
    });

    const context = new CompletionContext(view.state, 1, true);
    (context as unknown as { view: EditorView }).view = view;
    const result = await slashMenuSource({ enabled: false })(context);

    expect(result).toBeNull();
    expect(view.state.doc.toString()).toBe("/");

    view.destroy();
    container.remove();
  });

  it("provides Suggested and Basic blocks sections with shortcuts and Close menu", async () => {
    const trigger = slashMenuSource({ enabled: true });
    const lineStart = createContext("/", 1);
    const result = await trigger(lineStart.context);
    expect(result).not.toBeNull();
    const options = result?.options ?? [];

    const aiNotes = options.find((o) => o.label === "AI Meeting Notes");
    expect(aiNotes).toBeDefined();
    expect((aiNotes?.section as { name: string })?.name).toBe("Suggested");

    const htmlEmbeds = options.find((o) => o.label === "HTML · Embeds");
    expect(htmlEmbeds).toBeDefined();
    expect((htmlEmbeds?.section as { name: string })?.name).toBe("Suggested");

    const textOpt = options.find((o) => o.label === "Text");
    expect(textOpt).toBeDefined();
    expect((textOpt?.section as { name: string })?.name).toBe("Basic blocks");

    const h1Opt = options.find((o) => o.label === "Heading 1");
    expect(h1Opt).toBeDefined();
    expect(h1Opt?.detail).toBe("#");
    expect((h1Opt?.section as { name: string })?.name).toBe("Basic blocks");

    const closeOpt = options.find((o) => o.label === "Close menu");
    expect(closeOpt).toBeDefined();
    expect(closeOpt?.detail).toBe("esc");
    expect((closeOpt?.section as { name: string })?.name).toBe("Actions");
  });
});
