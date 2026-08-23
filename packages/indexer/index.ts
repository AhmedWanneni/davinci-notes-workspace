export { buildGraph, updateGraphForNote } from "./buildGraph";
export type { GraphEdge, GraphIndex, GraphNode } from "./buildGraph";
export {
  buildTagIndex,
  createEmptyTagIndex,
  getAllTagKeys,
  getCanonicalTag,
  queryNotesByTag,
  removeNoteFromTagIndex,
  updateTagIndexForNote,
} from "./buildTags";
export type { TagIndex } from "./buildTags";
export {
  createDefaultSearchOperatorRegistry,
  parseSearchQuery,
} from "./searchQuery";
export type {
  ParsedSearchQuery,
  SearchOperatorClause,
  SearchOperatorHandler,
  SearchOperatorRegistry,
  SearchQueryClause,
  SearchQueryError,
  TagSearchClause,
} from "./searchQuery";
export { executeSearchQuery } from "./searchExecution";
export type { SearchDatabase, SearchResult } from "./searchExecution";
export { parseFrontmatter } from "./parseFrontmatter";
export type { ParseFrontmatterResult } from "./parseFrontmatter";
export { parseNoteTags } from "./parseNoteTags";
export {
  parseLinks,
  findWikilinkCandidates,
  parseWikilinkTarget,
  WIKILINK_PATTERN,
  MARKDOWN_LINK_PATTERN,
} from "./parseLinks";
export type { ParseLinksOptions } from "./parseLinks";
