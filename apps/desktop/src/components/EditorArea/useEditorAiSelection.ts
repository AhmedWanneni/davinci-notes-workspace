import { useState, useEffect, useCallback, useRef } from "react";
import type { EditorView } from "@codemirror/view";
import type { SelectionBounds } from "./EditorAiSelectionTypes";

export function getSelectionBoundingRect(
  view: EditorView,
  from: number,
  to: number,
): DOMRect | null {
  try {
    const fromCoords = view.coordsAtPos(from);
    const toCoords = view.coordsAtPos(to);
    if (!fromCoords || !toCoords) return null;

    const top = Math.min(fromCoords.top, toCoords.top);
    const bottom = Math.max(fromCoords.bottom, toCoords.bottom);
    const left = Math.min(fromCoords.left, toCoords.left);
    const right = Math.max(fromCoords.right, toCoords.right);

    return new DOMRect(left, top, Math.max(right - left, 1), bottom - top);
  } catch {
    return null;
  }
}

export function useEditorAiSelection(view: EditorView | null) {
  const [selectionBounds, setSelectionBounds] =
    useState<SelectionBounds | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isPopoverOpenRef = useRef(false);
  isPopoverOpenRef.current = isPopoverOpen;

  const updateSelection = useCallback(() => {
    if (!view) {
      setSelectionBounds(null);
      return;
    }

    const { from, to } = view.state.selection.main;
    if (from === to) {
      if (!isPopoverOpenRef.current) {
        setSelectionBounds(null);
      }
      return;
    }

    const rawText = view.state.sliceDoc(from, to);
    if (!rawText.trim()) {
      if (!isPopoverOpenRef.current) {
        setSelectionBounds(null);
      }
      return;
    }

    const rect = getSelectionBoundingRect(view, from, to);
    if (!rect) {
      if (!isPopoverOpenRef.current) {
        setSelectionBounds(null);
      }
      return;
    }

    setSelectionBounds({ from, to, text: rawText, rect });
  }, [view]);

  useEffect(() => {
    if (!view) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const handlePointerUp = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(updateSelection, 120);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPopoverOpen(false);
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(updateSelection, 120);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const { from, to } = view.state.selection.main;
        if (from !== to && view.state.sliceDoc(from, to).trim()) {
          e.preventDefault();
          updateSelection();
          setIsPopoverOpen(true);
        }
      }
    };

    const handleDocumentPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-ai-selection-trigger='true']") ||
        target.closest("[role='dialog'][aria-label='Edit text with AI']")
      ) {
        return;
      }
      if (!dom.contains(target) && !isPopoverOpenRef.current) {
        setSelectionBounds(null);
      }
    };

    const dom = view.dom;
    dom.addEventListener("pointerup", handlePointerUp);
    dom.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      if (timer) clearTimeout(timer);
      dom.removeEventListener("pointerup", handlePointerUp);
      dom.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [view, updateSelection]);

  const openPopover = useCallback(() => {
    updateSelection();
    setIsPopoverOpen(true);
  }, [updateSelection]);

  const closePopover = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  const replaceSelection = useCallback(
    (newText: string) => {
      if (!view || !selectionBounds) return;
      const { from, to } = selectionBounds;
      view.dispatch({
        changes: { from, to, insert: newText },
        selection: { anchor: from, head: from + newText.length },
        userEvent: "input.ai",
      });
      view.focus();
      setIsPopoverOpen(false);
    },
    [view, selectionBounds],
  );

  const insertBelowSelection = useCallback(
    (newText: string) => {
      if (!view || !selectionBounds) return;
      const line = view.state.doc.lineAt(selectionBounds.to);
      const insertPos = line.to;
      const insertStr = `\n\n${newText.trim()}`;
      view.dispatch({
        changes: { from: insertPos, insert: insertStr },
        selection: { anchor: insertPos + insertStr.length },
        userEvent: "input.ai",
      });
      view.focus();
      setIsPopoverOpen(false);
    },
    [view, selectionBounds],
  );

  return {
    selectionBounds,
    isPopoverOpen,
    openPopover,
    closePopover,
    replaceSelection,
    insertBelowSelection,
  };
}
