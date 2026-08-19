export { Editor } from "./Editor";
export type { EditorProps } from "./Editor";
export { MarkdownView } from "./MarkdownView";
export type { MarkdownViewProps } from "./MarkdownView";
export {
  defaultEditorSettings,
  editorFonts,
  isEditorFont,
  loadEditorSettings,
  saveEditorSetting,
} from "./editorSettings";
export type {
  EditorFont,
  EditorSettings,
  EditorSettingsStorage,
} from "./editorSettings";
export {
  softLineBreakExtension,
  insertHardLineBreak,
} from "./lineBreakExtension";
export {
  editorHighlightStyle,
  editorTheme,
  readOnlyEditorTheme,
} from "./editorTheme";
export { livePreviewExtension } from "./livePreviewExtension";
export { wikilinkExtension } from "./wikilinkExtension";
export { highlightExtension, highlightTag } from "./highlightExtension";
export { Strikethrough } from "@lezer/markdown";
export { syntaxHighlighting } from "@codemirror/language";
