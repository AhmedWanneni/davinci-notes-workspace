/** A text quote anchor. It survives harmless DOM reshaping without serialising HTML. */
export interface HighlightRecord {
  id: string;
  url: string;
  text: string;
  /** Which identical occurrence in the page's visible text was selected. */
  occurrence: number;
  createdAt: string;
}

export const MAX_HIGHLIGHTS = 2_000;
export const MAX_HIGHLIGHTS_PER_URL = 200;
export const MAX_HIGHLIGHT_TEXT_LENGTH = 2_000;
