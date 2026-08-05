/** A parsed outbound link from note content (wikilink or markdown). */
export interface Link {
  /** Resolved vault-relative path, or raw target text when unresolved. */
  target: string;
  /** Raw target before resolution (note name or markdown href). */
  targetRaw: string;
  /** Alias text from `[[target|display]]`. */
  displayText?: string;
  /** Heading fragment from `[[note#Heading]]`. */
  heading?: string;
  /** Block reference from `[[note#^block-id]]`. */
  blockId?: string;
  type: "wikilink" | "markdown";
  /** Whether `target` maps to an existing note in the vault. */
  resolved: boolean;
}
