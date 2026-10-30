import { useSyncExternalStore } from "react";
import type { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { InsertDialogInput, InsertItem } from "./InsertItem";
import { insertItem } from "./InsertAction";
import { recordRecentInsert } from "./recentInsertStore";

export interface InsertDialogRequest {
  item: InsertItem;
  view: EditorView;
  selection: EditorSelection;
}

type DialogListener = (request: InsertDialogRequest | null) => void;

let currentRequest: InsertDialogRequest | null = null;
const listeners = new Set<DialogListener>();

export function getInsertDialogRequest(): InsertDialogRequest | null {
  return currentRequest;
}

export function openInsertDialog(request: InsertDialogRequest): void {
  currentRequest = request;
  listeners.forEach((listener) => listener(currentRequest));
}

export function closeInsertDialog(): void {
  if (currentRequest === null) return;
  currentRequest = null;
  listeners.forEach((listener) => listener(null));
}

export function subscribeInsertDialog(listener: DialogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInsertDialogRequest(): InsertDialogRequest | null {
  return useSyncExternalStore(
    subscribeInsertDialog,
    getInsertDialogRequest,
    getInsertDialogRequest,
  );
}

/**
 * Runs insertion for an item. If the item defines a dialog spec, opens
 * the dialog; otherwise inserts directly. Respects editable facet.
 */
export function runInsertItem(
  view: EditorView,
  item: InsertItem,
  selection: EditorSelection = view.state.selection,
  selectedText?: string,
): boolean {
  if (!view.state.facet(EditorView.editable)) return false;

  if (item.dialog) {
    openInsertDialog({ item, view, selection });
    return true;
  }

  const text =
    selectedText !== undefined
      ? selectedText
      : view.state.doc.sliceString(selection.main.from, selection.main.to);
  const success = insertItem(view, item, selection, text);
  if (success) {
    recordRecentInsert(item.id);
  }
  return success;
}

export function completeInsertDialog(
  request: InsertDialogRequest,
  input: InsertDialogInput,
): boolean {
  if (!request.view.state.facet(EditorView.editable)) {
    closeInsertDialog();
    return false;
  }

  const success = insertItem(
    request.view,
    request.item,
    request.selection,
    "",
    input,
  );
  if (success) {
    recordRecentInsert(request.item.id);
  }
  closeInsertDialog();
  request.view.focus();
  return success;
}

export function cancelInsertDialog(request: InsertDialogRequest): void {
  const range = request.selection.main;
  if (range.from < range.to) {
    const text = request.view.state.doc.sliceString(range.from, range.to);
    if (text.startsWith("/")) {
      request.view.dispatch({
        changes: { from: range.from, to: range.to, insert: "" },
      });
    }
  }
  closeInsertDialog();
  request.view.focus();
}
