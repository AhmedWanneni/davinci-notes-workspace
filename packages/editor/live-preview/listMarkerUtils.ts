import type { EditorState } from "@codemirror/state";

export const LIST_LINE_REGEX =
  /^(\s*)([-*+]|\d+[.)]|[a-zA-Z][.)]|[ivxIVX]+[.)])([ \t]+)(?:\[([ xX])\][ \t]*)?(.*)$/;

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

export function getNextMarker(marker: string): string {
  const numMatch = marker.match(/^(\d+)([.)])$/);
  if (numMatch) return `${parseInt(numMatch[1], 10) + 1}${numMatch[2]}`;

  const alphaMatch = marker.match(/^([a-zA-Z])([.)])$/);
  if (alphaMatch) {
    const isUpper = alphaMatch[1] === alphaMatch[1].toUpperCase();
    const charCode = alphaMatch[1].toLowerCase().charCodeAt(0);
    const nextChar = charCode >= 122 ? "a" : String.fromCharCode(charCode + 1);
    return `${isUpper ? nextChar.toUpperCase() : nextChar}${alphaMatch[2]}`;
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

export function findParentPrefix(
  state: EditorState,
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
