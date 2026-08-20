/** A validated tag without its leading hash. */
export interface Tag {
  /** Case-folded identity used for lookup and registry keys. */
  key: string;
  /** First-seen display spelling, including the leading `#`. */
  display: string;
  /** Slash-separated display segments without leading hashes. */
  segments: readonly string[];
}

/** A tag occurrence found in a larger string. */
export interface TagMatch {
  raw: string;
  tag: string;
  start: number;
  end: number;
}
