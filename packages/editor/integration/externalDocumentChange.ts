import { Annotation, Transaction } from "@codemirror/state";

export const externalDocumentChange = Annotation.define<boolean>();

export function minimalDocumentChange(previous: string, next: string) {
  let from = 0;
  while (from < previous.length && previous[from] === next[from]) from += 1;

  let previousEnd = previous.length;
  let nextEnd = next.length;
  while (
    previousEnd > from &&
    nextEnd > from &&
    previous[previousEnd - 1] === next[nextEnd - 1]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  return { from, to: previousEnd, insert: next.slice(from, nextEnd) };
}

export const externalChangeAnnotations = [
  Transaction.addToHistory.of(false),
  externalDocumentChange.of(true),
];
