import { readSchemaOrg } from "./readSchemaOrg";

/**
 * Schema.org types this page declares, for `schema:@Type` template triggers.
 *
 * Only top-level nodes are reported: `readSchemaOrg` indexes the root nodes and
 * `@graph` entries but deliberately does not recurse into nested objects. An
 * article whose `author` is a `Person` is an `Article`, not a `Person` page —
 * reporting nested types would auto-apply every `schema:@Person` template to
 * every news article.
 */
export function schemaTypesOf(doc: Document): string[] {
  return [...readSchemaOrg(doc).byType.keys()];
}
