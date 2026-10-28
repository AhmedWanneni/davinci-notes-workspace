// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditorAiSelectionPopover } from "./EditorAiSelectionPopover";
import type { SelectionBounds } from "./EditorAiSelectionTypes";

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

vi.mock("./executeAiSelectionPrompt", () => ({
  executeAiSelectionPrompt: (...args: unknown[]) => mockExecute(...args),
}));

const mockBounds: SelectionBounds = {
  from: 0,
  to: 11,
  text: "Hello world",
  rect: new DOMRect(100, 100, 80, 20),
};

describe("EditorAiSelectionPopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when isOpen is true with quoted selection and action chips", () => {
    render(
      <EditorAiSelectionPopover
        bounds={mockBounds}
        isOpen={true}
        onClose={vi.fn()}
        onReplace={vi.fn()}
        onInsertBelow={vi.fn()}
      />,
    );

    expect(screen.getByText('"Hello world"')).toBeDefined();
    expect(screen.getByText("Rewrite")).toBeDefined();
    expect(screen.getByText("Shorten")).toBeDefined();
    expect(screen.getByText("Fix Grammar")).toBeDefined();
  });

  it("triggers AI execution when quick action chip is clicked and displays result", async () => {
    mockExecute.mockResolvedValueOnce("Improved: Hello wonderful world");
    const onReplace = vi.fn();

    render(
      <EditorAiSelectionPopover
        bounds={mockBounds}
        isOpen={true}
        onClose={vi.fn()}
        onReplace={onReplace}
        onInsertBelow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Rewrite"));

    await waitFor(() => {
      expect(screen.getByText("Improved: Hello wonderful world")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Replace"));
    expect(onReplace).toHaveBeenCalledWith("Improved: Hello wonderful world");
  });

  it("triggers AI execution when custom prompt is submitted and inserts below", async () => {
    mockExecute.mockResolvedValueOnce("Bullet 1\nBullet 2");
    const onInsertBelow = vi.fn();

    render(
      <EditorAiSelectionPopover
        bounds={mockBounds}
        isOpen={true}
        onClose={vi.fn()}
        onReplace={vi.fn()}
        onInsertBelow={onInsertBelow}
      />,
    );

    const input = screen.getByPlaceholderText(
      "Ask AI to edit, amend, explain...",
    );
    fireEvent.change(input, { target: { value: "Make bullet points" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/Bullet 1/)).toBeDefined();
    });

    fireEvent.click(screen.getByText("Insert Below"));
    expect(onInsertBelow).toHaveBeenCalledWith("Bullet 1\nBullet 2");
  });

  it("invokes onOpenAgent when Ask in Agent is clicked", async () => {
    mockExecute.mockResolvedValueOnce("AI answer");
    const onOpenAgent = vi.fn();
    const onClose = vi.fn();

    render(
      <EditorAiSelectionPopover
        bounds={mockBounds}
        isOpen={true}
        noteTitle="Project Idea"
        onClose={onClose}
        onReplace={vi.fn()}
        onInsertBelow={vi.fn()}
        onOpenAgent={onOpenAgent}
      />,
    );

    fireEvent.click(screen.getByText("Explain"));

    await waitFor(() => {
      expect(screen.getByText("Ask in Agent")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Ask in Agent"));
    expect(onOpenAgent).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <EditorAiSelectionPopover
        bounds={mockBounds}
        isOpen={true}
        onClose={onClose}
        onReplace={vi.fn()}
        onInsertBelow={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when user clicks outside the popover", () => {
    const onClose = vi.fn();
    render(
      <EditorAiSelectionPopover
        bounds={mockBounds}
        isOpen={true}
        onClose={onClose}
        onReplace={vi.fn()}
        onInsertBelow={vi.fn()}
      />,
    );

    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
