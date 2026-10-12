export type InsertGroup = "Basics" | "Code and data" | "HTML" | "Media";

export type InsertIconName =
  | "Code"
  | "Function"
  | "Image"
  | "ListBullets"
  | "ListNumbers"
  | "ListChecks"
  | "MathOperations"
  | "Minus"
  | "Note"
  | "Quotes"
  | "Table"
  | "TextHOne"
  | "TextHTwo"
  | "TextHThree"
  | "TextT"
  | "TwitterLogo"
  | "VideoCamera";

export interface InsertDialogInput {
  url?: string;
  path?: string;
  [key: string]: unknown;
}

export interface InsertDialogSpec {
  title: string;
  description?: string;
  kind: "media-url" | "image-sources";
  placeholder?: string;
  confirmLabel?: string;
  validate?: (input: InsertDialogInput) => string | null;
}

export interface InsertBuildContext {
  selectedText: string;
  input?: InsertDialogInput;
}

export interface InsertBuildResult {
  text: string;
  block: boolean;
}

export interface InsertItem {
  id: string;
  group: InsertGroup;
  label: string;
  icon: InsertIconName;
  keywords: readonly string[];
  dialog?: InsertDialogSpec;
  build(context: InsertBuildContext): InsertBuildResult;
}
