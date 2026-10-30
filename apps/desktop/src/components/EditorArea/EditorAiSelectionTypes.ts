export type AiSelectionActionKind =
  | "rewrite"
  | "shorten"
  | "fix-grammar"
  | "explain"
  | "expand"
  | "bullets"
  | "custom";

export interface SelectionBounds {
  from: number;
  to: number;
  text: string;
  rect: DOMRect;
}

export type AiSelectionStatus = "idle" | "loading" | "success" | "error";

export interface AiSelectionResult {
  action: AiSelectionActionKind;
  prompt: string;
  originalText: string;
  generatedText: string;
}

export interface QuickActionDef {
  id: AiSelectionActionKind;
  label: string;
  description: string;
  prompt: string;
}

export const AI_SELECTION_QUICK_ACTIONS: readonly QuickActionDef[] = [
  {
    id: "rewrite",
    label: "Rewrite",
    description: "Improve clarity and flow",
    prompt: "Rewrite the selected text clearly, concisely, and naturally.",
  },
  {
    id: "shorten",
    label: "Shorten",
    description: "Make concise",
    prompt:
      "Shorten the selected text to its core meaning without losing key facts.",
  },
  {
    id: "fix-grammar",
    label: "Fix Grammar",
    description: "Correct spelling and grammar",
    prompt:
      "Correct spelling, punctuation, and grammar while preserving original tone.",
  },
  {
    id: "explain",
    label: "Explain",
    description: "Explain this concept",
    prompt: "Explain the meaning and key concepts of the selected text simply.",
  },
  {
    id: "expand",
    label: "Expand",
    description: "Elaborate with details",
    prompt:
      "Elaborate and provide more relevant depth or examples for the selected text.",
  },
  {
    id: "bullets",
    label: "To Bullets",
    description: "Format as bullet list",
    prompt:
      "Convert the key ideas of the selected text into a clean markdown bullet list.",
  },
];
