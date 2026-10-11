export type InsertGroup = "Basics" | "Code and data" | "HTML";

export type InsertIconName =
  | "Code"
  | "Function"
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
  | "TextT";

export interface InsertBuildContext {
  selectedText: string;
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
  build(context: InsertBuildContext): InsertBuildResult;
}
