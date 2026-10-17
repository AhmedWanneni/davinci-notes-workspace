export {
  CLIP_BEHAVIORS,
  CLIP_PAYLOAD_VERSION,
  type ClipAck,
  type ClipAckStatus,
  type ClipAttachmentRef,
  type ClipBehavior,
  type ClipError,
  type ClipHighlight,
  type ClipMode,
  type ClipPayload,
  type ClipPropertyValue,
  type ClipSource,
  type ClipTarget,
} from "./ClipPayload.js";
export type { ClipTemplate, ClipTemplateProperty } from "./ClipTemplate.js";

export {
  parseTemplateExpression,
  splitTopLevel,
} from "./TemplateExpression.js";
export type { TemplateExpression } from "./TemplateExpression.js";
export {
  parseVariableReference,
  PRESET_VARIABLE_NAMES,
  type MetaAttribute,
  type VariableReference,
} from "./VariableReference.js";

export type {
  FilterArgument,
  FilterCall,
  FilterFunction,
  FilterRegistry,
  FilterRuntime,
} from "./filterTypes.js";
export { DEFAULT_FILTERS, createFilterRegistry } from "./filterRegistry.js";
export {
  blockquoteFilter,
  highlightFilter,
  imageFilter,
  linkFilter,
  markdownFilter,
  wikilinkFilter,
} from "./markdownFilters.js";

export {
  applyFilters,
  parseTemplateString,
  renderTemplateString,
  stringifyValue,
  type RenderContext,
  type TemplateSegment,
} from "./renderTemplateString.js";
export {
  resolveVariable,
  UNSUPPORTED_PROMPT_MARKER,
  type VariableContext,
} from "./resolveVariable.js";
export type { VariableValue } from "./VariableValue.js";

export { formatDate, parseDateInput } from "./formatDate.js";
export { buildPresetClock, toLocalIso } from "./presetClock.js";
export {
  isSafeRelativePath,
  safeName,
  type SafeNameOptions,
  type SafeNameOs,
} from "./safeName.js";
export { isReservedPropertyName } from "./propertyName.js";
export { renderFrontmatter, yamlScalar } from "./frontmatter.js";
export {
  composeNoteFile,
  suggestedFilePath,
  type NoteFileInput,
} from "./composeNoteFile.js";
export {
  DEFAULT_DAILY_NOTE_FORMAT,
  normalizeNoteName,
  renderNoteName,
} from "./noteName.js";
export { resolveDailyNotePath } from "./dailyNote.js";
export {
  normalizeFolder,
  renderClipTemplate,
  type RenderedClip,
  type RenderClipOptions,
} from "./renderClipTemplate.js";
export {
  buildClipPayload,
  contentHash,
  type BuildClipPayloadInput,
} from "./buildClipPayload.js";
export {
  validateClipTemplate,
  type ClipTemplateValidation,
} from "./validateClipTemplate.js";
export {
  MAX_REGEX_SOURCE_LENGTH,
  MAX_TRIGGER_LENGTH,
  MAX_TRIGGER_URL_LENGTH,
  parseTriggerRule,
  triggerRuleError,
  type TriggerRule,
  type TriggerRuleParse,
} from "./triggerRule.js";
export {
  matchesTrigger,
  matchTemplate,
  type TriggerContext,
} from "./matchTemplate.js";
export {
  ARTICLE_TEMPLATE,
  MOVIE_TEMPLATE,
  PAPER_TEMPLATE,
  RECIPE_TEMPLATE,
  STARTER_TEMPLATES,
} from "./starterTemplates.js";
export {
  deriveSuggestedImageName,
  extractImageAttachments,
  rewriteMarkdownImageLinks,
} from "./attachmentExtractor.js";
export {
  isQueueEntryExpired,
  MAX_QUEUE_AGE_MS,
  MAX_QUEUE_BYTES,
  MAX_QUEUE_ENTRIES,
  type ClipQueueEntry,
} from "./ClipQueue.js";

/** Package identifier kept for shell smoke tests. */
export const name = "@app/clipper-core";
